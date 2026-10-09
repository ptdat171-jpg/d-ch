import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const MAX_UPLOAD_SIZE_BYTES = 500 * 1024 * 1024; // 500 MB

// Middleware for binary chunk uploads
app.use('/api/upload/chunk', express.raw({ type: 'application/octet-stream', limit: '10mb' }));

// Middleware for JSON and urlencoded payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to get Gemini client
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory upload sessions for chunked upload
interface UploadSession {
  uploadId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  filePath: string;
  bytesReceived: number;
  createdAt: number;
}
const uploadSessions = new Map<string, UploadSession>();

// Cleanup stale sessions older than 1 hour
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of uploadSessions.entries()) {
    if (now - session.createdAt > 60 * 60 * 1000) {
      fs.promises.unlink(session.filePath).catch(() => {});
      uploadSessions.delete(id);
    }
  }
}, 10 * 60 * 1000);

// Status check endpoint
app.get('/api/status', (_req: Request, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const configured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
  res.json({
    status: 'ok',
    configured,
    primaryModel: 'gemini-3.1-flash-lite',
    fallbackModel: 'gemini-3.8-flash',
    supportedFormats: [
      'audio/mp3',
      'audio/mpeg',
      'audio/wav',
      'audio/m4a',
      'audio/x-m4a',
      'audio/webm',
      'audio/ogg',
      'audio/flac',
      'audio/aac',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/mov'
    ],
    maxSizeMB: 500,
    chunkSizeMB: 4,
    chunkedUploadSupported: true,
    ffmpegAvailable: true
  });
});

// Helper to build system prompt
function buildTranscriptionPrompt(options: {
  language?: string;
  mode?: string;
  punctuate?: boolean;
  speakerDiarization?: boolean;
  timestamps?: boolean;
}): string {
  const {
    language = 'auto',
    mode = 'clean',
    punctuate = true,
    speakerDiarization = true,
    timestamps = true
  } = options;

  const langInstructions: Record<string, string> = {
    auto: 'Tự động nhận diện ngôn ngữ nói chính trong tệp (đặc biệt nhận diện chính xác tiếng Việt nếu là tiếng Việt, hoặc tiếng Anh nếu là tiếng Anh).',
    vi: 'Ngôn ngữ của bản ghi là Tiếng Việt. Hãy phiên âm tiếng Việt chuẩn xác từng dấu thanh, ngữ pháp và thuật ngữ.',
    en: 'The language is English. Transcribe accurately with proper grammar and capitalization.',
    ja: '言語は日本語です。自然な漢字・ひらがな・カタカナで文字起こししてください。',
    ko: '언어는 한국어입니다. 자연스러운 한국어로 텍스트를 변환해주세요.',
    zh: '语言为中文。请准确转写文字。',
    fr: 'La langue est le français. Transcrivez avec une ponctuation et une grammaire correctes.',
    es: 'El idioma es español. Transcriba con puntuación y gramática correctas.',
    de: 'Die Sprache ist Deutsch. Transkribieren Sie mit korrekter Rechtschreibung und Grammatik.',
  };

  const targetLangDesc = langInstructions[language] || langInstructions.auto;

  const modeDesc =
    mode === 'verbatim'
      ? 'Chế độ Nguyên văn (Verbatim): Ghi lại chính xác mọi từ ngữ đã nói, giữ lại các từ đệm như "ừm", "ờ", "à", "uh", "um" nếu người nói thốt ra.'
      : 'Chế độ Văn bản rõ ràng (Clean Read): Loại bỏ các từ đệm, tiếng ậm ừ, chỉnh sửa câu nói mượt mà, văn phong chuyên nghiệp và tự nhiên, giữ trọn vẹn ý nghĩa của người nói.';

  const speakerDesc = speakerDiarization
    ? 'Phân tách và gán nhãn người nói (Speaker Diarization): Ví dụ "Người nói 1", "Người nói 2" (hoặc "Speaker 1", "Speaker 2") cho từng phân đoạn khi có sự thay đổi người nói.'
    : 'Gán người nói mặc định là "Người nói 1".';

  const timestampDesc = timestamps
    ? 'Dấu thời gian (Timestamps): Gán chính xác thời điểm bắt đầu (start tính bằng giây, ví dụ 0.0, 4.5) và kết thúc (end tính bằng giây, ví dụ 4.2, 8.9) cho từng câu hoặc phân đoạn phát biểu.'
    : 'Phân đoạn theo từng câu với ước lượng thời gian hợp lý.';

  return `Bạn là một hệ thống AI phiên âm âm thanh và video chuyên nghiệp cấp độ cao (Speech-to-Text Transcription Engine).
Nhiệm vụ của bạn là lắng nghe tệp âm thanh/video được cung cấp và chuyển đổi toàn bộ lời nói thành văn bản có cấu trúc rõ ràng.

Yêu cầu chi tiết:
1. ${targetLangDesc}
2. ${modeDesc}
3. ${speakerDesc}
4. ${timestampDesc}
5. Dấu câu: ${punctuate ? 'Tự động thêm dấu chấm, dấu phẩy, dấu chấm hỏi, dấu cảm thán đúng vị trí.' : 'Không can thiệp quá nhiều dấu câu.'}
6. Định dạng đầu ra: Bắt buộc trả về đúng cấu trúc JSON, không kèm bất kỳ giải thích nào ngoài JSON.

Cấu trúc JSON mong muốn:
{
  "detectedLanguage": "Tiếng Việt",
  "fullText": "Toàn bộ bài phiên âm hoàn chỉnh liền mạch...",
  "summary": "Tóm tắt ngắn gọn 1-2 câu về nội dung chính của tệp âm thanh...",
  "segments": [
    {
      "id": 1,
      "start": 0.0,
      "end": 3.8,
      "speaker": "Người nói 1",
      "text": "Nội dung lời nói của câu đầu tiên."
    }
  ]
}`;
}

// Helper to parse transcription JSON response
function parseTranscriptionResult(responseText: string, language: string) {
  let parsedData: any;
  try {
    let cleaned = responseText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    parsedData = JSON.parse(cleaned);
  } catch (jsonErr) {
    console.warn('Could not parse clean JSON from model output, using text fallback:', jsonErr);
    parsedData = {
      detectedLanguage: language === 'vi' ? 'Tiếng Việt' : 'Tự động',
      fullText: responseText.trim(),
      summary: 'Đã hoàn tất phiên âm.',
      segments: [
        {
          id: 1,
          start: 0.0,
          end: 10.0,
          speaker: 'Người nói 1',
          text: responseText.trim(),
        },
      ],
    };
  }

  const rawSegments = Array.isArray(parsedData.segments) ? parsedData.segments : [];
  const formattedSegments = rawSegments.map((seg: any, idx: number) => ({
    id: seg.id || idx + 1,
    start: typeof seg.start === 'number' ? seg.start : idx * 3.0,
    end: typeof seg.end === 'number' ? seg.end : (idx + 1) * 3.0,
    speaker: seg.speaker || `Người nói ${idx % 2 === 0 ? '1' : '2'}`,
    text: (seg.text || '').trim(),
  })).filter((seg: any) => seg.text.length > 0);

  const fullText = (parsedData.fullText || formattedSegments.map((s: any) => s.text).join(' ')).trim();
  const words = fullText.length > 0 ? fullText.split(/\s+/).filter(Boolean).length : 0;
  const chars = fullText.length;
  const totalDuration = formattedSegments.length > 0
    ? formattedSegments[formattedSegments.length - 1].end
    : 0;

  return {
    detectedLanguage: parsedData.detectedLanguage || 'Tiếng Việt',
    summary: parsedData.summary || '',
    fullText: fullText || 'Không phát hiện tiếng nói rõ ràng trong tệp này.',
    segments: formattedSegments.length > 0 ? formattedSegments : [
      {
        id: 1,
        start: 0.0,
        end: 5.0,
        speaker: 'Người nói 1',
        text: fullText || 'Không phát hiện thấy tiếng nói.'
      }
    ],
    stats: {
      words,
      chars,
      segmentsCount: Math.max(1, formattedSegments.length),
      duration: Math.round(totalDuration),
    },
  };
}

// ----------------------------------------------------------------------------
// CHUNKED UPLOAD ENDPOINTS (For files up to 500 MB)
// ----------------------------------------------------------------------------

// 1. Initialize Chunked Upload
app.post('/api/upload/init', (req: Request, res: Response) => {
  const { fileName, fileSize, mimeType } = req.body;

  if (!fileSize || typeof fileSize !== 'number' || fileSize <= 0) {
    return res.status(400).json({
      error: 'Dữ liệu không hợp lệ',
      message: 'Kích thước tệp không hợp lệ.',
    });
  }

  if (fileSize > MAX_UPLOAD_SIZE_BYTES) {
    const sizeInMB = (fileSize / (1024 * 1024)).toFixed(1);
    return res.status(413).json({
      error: 'Tệp quá lớn',
      message: `Dung lượng tệp (${sizeInMB}MB) vượt quá giới hạn tối đa cho phép (500MB).`,
    });
  }

  const uploadId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const ext = path.extname(fileName || '') || (mimeType?.includes('video') ? '.mp4' : '.mp3');
  const tempPath = path.join(os.tmpdir(), `vt-raw-${uploadId}${ext}`);

  try {
    // Create/truncate empty file
    fs.writeFileSync(tempPath, Buffer.alloc(0));

    uploadSessions.set(uploadId, {
      uploadId,
      fileName: fileName || 'media-file',
      fileSize,
      mimeType: mimeType || 'video/mp4',
      filePath: tempPath,
      bytesReceived: 0,
      createdAt: Date.now(),
    });

    return res.json({
      success: true,
      uploadId,
      chunkSize: 4 * 1024 * 1024, // 4 MB chunks (safely below 32MB Cloud Run limit)
    });
  } catch (err: any) {
    console.error('Failed to init upload file:', err);
    return res.status(500).json({
      error: 'Lỗi khởi tạo tải lên',
      message: err.message,
    });
  }
});

// 2. Upload a single binary chunk (typically 4 MB)
app.post('/api/upload/chunk', async (req: Request, res: Response) => {
  const uploadId = req.headers['x-upload-id'] as string;
  const chunkIndex = parseInt((req.headers['x-chunk-index'] as string) || '0', 10);
  const totalChunks = parseInt((req.headers['x-total-chunks'] as string) || '1', 10);

  if (!uploadId || !uploadSessions.has(uploadId)) {
    return res.status(404).json({
      error: 'Phiên tải lên không tồn tại',
      message: 'Phiên tải lên đã hết hạn hoặc không tìm thấy. Vui lòng thử lại.',
    });
  }

  const session = uploadSessions.get(uploadId)!;
  const chunkBuffer = req.body as Buffer;

  if (!chunkBuffer || chunkBuffer.length === 0) {
    return res.status(400).json({
      error: 'Chunk rỗng',
      message: 'Không nhận được dữ liệu của phần tệp này.',
    });
  }

  try {
    await fs.promises.appendFile(session.filePath, chunkBuffer);
    session.bytesReceived += chunkBuffer.length;

    return res.json({
      success: true,
      chunkIndex,
      totalChunks,
      bytesReceived: session.bytesReceived,
      fileSize: session.fileSize,
      progress: Math.min(100, Math.round((session.bytesReceived / session.fileSize) * 100)),
    });
  } catch (err: any) {
    console.error('Error writing chunk to disk:', err);
    return res.status(500).json({
      error: 'Lỗi ghi tệp',
      message: err.message || 'Không thể lưu phần tệp tải lên.',
    });
  }
});

// 2b. Cancel an active upload session and cleanup files
app.post('/api/upload/cancel', async (req: Request, res: Response) => {
  const { uploadId } = req.body;
  if (uploadId && uploadSessions.has(uploadId)) {
    const session = uploadSessions.get(uploadId)!;
    await fs.promises.unlink(session.filePath).catch(() => {});
    uploadSessions.delete(uploadId);
  }
  return res.json({ success: true, message: 'Đã hủy phiên tải lên.' });
});

// 3. Finalize upload, extract audio with FFmpeg, and transcribe with Gemini
app.post('/api/upload/transcribe', async (req: Request, res: Response) => {
  const {
    uploadId,
    language = 'auto',
    mode = 'clean',
    punctuate = true,
    speakerDiarization = true,
    timestamps = true,
  } = req.body;

  if (!uploadId || !uploadSessions.has(uploadId)) {
    return res.status(404).json({
      error: 'Phiên tải lên không hợp lệ',
      message: 'Không tìm thấy phiên tải lên hoặc phiên đã bị hủy.',
    });
  }

  const session = uploadSessions.get(uploadId)!;
  const ai = getGeminiClient();
  if (!ai) {
    return res.status(503).json({
      error: 'Chưa cấu hình API Key',
      message: 'GEMINI_API_KEY chưa được thiết lập trên máy chủ. Vui lòng thiết lập biến môi trường.',
    });
  }

  let extractedAudioPath: string | null = null;
  let targetAudioPath = session.filePath;
  let targetMimeType = session.mimeType;
  let uploadedFile: any = null;

  try {
    // A. Check if file is a video or uncompressed audio; if so, extract compact 16kHz mono MP3 via FFmpeg
    const isVideo =
      session.mimeType.startsWith('video') ||
      session.fileName.match(/\.(mp4|webm|mov|mkv|avi)$/i);

    if (isVideo) {
      extractedAudioPath = path.join(os.tmpdir(), `vt-audio-${uploadId}.mp3`);
      try {
        await execFileAsync('ffmpeg', [
          '-y',
          '-loglevel', 'error',
          '-i', session.filePath,
          '-vn',
          '-ar', '16000',
          '-ac', '1',
          '-b:a', '64k',
          extractedAudioPath,
        ], {
          maxBuffer: 50 * 1024 * 1024,
          timeout: 300000, // 5 minutes max
        });
        targetAudioPath = extractedAudioPath;
        targetMimeType = 'audio/mp3';
      } catch (ffmpegErr: any) {
        console.warn('FFmpeg extraction warning, falling back to original file:', ffmpegErr?.message);
      }
    } else if (session.mimeType.includes('wav') || session.mimeType.includes('flac') || session.fileName.match(/\.(wav|flac)$/i)) {
      // If uncompressed audio is large (> 20MB), convert to 16kHz mono MP3 for fast AI processing
      const origStat = await fs.promises.stat(session.filePath).catch(() => null);
      if (origStat && origStat.size > 20 * 1024 * 1024) {
        extractedAudioPath = path.join(os.tmpdir(), `vt-audio-${uploadId}.mp3`);
        try {
          await execFileAsync('ffmpeg', [
            '-y',
            '-loglevel', 'error',
            '-i', session.filePath,
            '-ar', '16000',
            '-ac', '1',
            '-b:a', '64k',
            extractedAudioPath,
          ], {
            maxBuffer: 50 * 1024 * 1024,
            timeout: 180000,
          });
          targetAudioPath = extractedAudioPath;
          targetMimeType = 'audio/mp3';
        } catch (compErr: any) {
          console.warn('Audio compression warning, using original audio:', compErr?.message);
        }
      }
    }

    // B. Prepare Gemini Media Part
    const fileStat = await fs.promises.stat(targetAudioPath);
    let mediaPart: any;

    if (fileStat.size > 15 * 1024 * 1024) {
      // Use Gemini Files API for files > 15MB (supports up to 2GB)
      uploadedFile = await ai.files.upload({
        file: targetAudioPath,
        config: { mimeType: targetMimeType },
      });
      mediaPart = {
        fileData: {
          fileUri: uploadedFile.uri,
          mimeType: targetMimeType,
        },
      };
    } else {
      // Inline data for files <= 15MB
      const buffer = await fs.promises.readFile(targetAudioPath);
      mediaPart = {
        inlineData: {
          mimeType: targetMimeType,
          data: buffer.toString('base64'),
        },
      };
    }

    // C. Generate transcription with model cascade
    const systemPrompt = buildTranscriptionPrompt({ language, mode, punctuate, speakerDiarization, timestamps });
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.5-transcribe'];
    let responseText = '';
    let lastErr: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              mediaPart,
              {
                text: `${systemPrompt}\n\nHãy lắng nghe tệp âm thanh này và phiên âm chi tiết thành JSON theo đúng schema trên.`,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
          },
        });
        const text = (response.text || '').trim();
        if (text) {
          responseText = text;
          break;
        }
      } catch (err: any) {
        lastErr = err;
        console.warn(`Model ${model} transcription attempt failed, checking fallback:`, err?.message || err);
      }
    }

    if (!responseText && lastErr) {
      throw lastErr;
    }

    const parsedData = parseTranscriptionResult(responseText, language);
    return res.json({
      success: true,
      fileName: session.fileName,
      detectedLanguage: parsedData.detectedLanguage,
      summary: parsedData.summary,
      fullText: parsedData.fullText,
      segments: parsedData.segments,
      stats: parsedData.stats,
    });
  } catch (err: any) {
    console.error('Transcription execution error:', err);
    return res.status(500).json({
      error: 'Lỗi trong quá trình phiên âm',
      message: err?.message || 'Đã xảy ra lỗi không xác định khi kết nối với mô hình AI.',
    });
  } finally {
    // Cleanup temporary files
    fs.promises.unlink(session.filePath).catch(() => {});
    if (extractedAudioPath) fs.promises.unlink(extractedAudioPath).catch(() => {});
    if (uploadedFile?.name) ai.files.delete({ name: uploadedFile.name }).catch(() => {});
    uploadSessions.delete(uploadId);
  }
});

// ----------------------------------------------------------------------------
// LEGACY DIRECT /api/transcribe ENDPOINT (For small mic recordings < 8MB)
// ----------------------------------------------------------------------------
app.post('/api/transcribe', async (req: Request, res: Response) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Chưa cấu hình API Key',
        message: 'GEMINI_API_KEY chưa được thiết lập trên máy chủ.',
      });
    }

    const {
      audioData,
      mimeType,
      fileName = 'audio-recording',
      language = 'auto',
      mode = 'clean',
      punctuate = true,
      speakerDiarization = true,
      timestamps = true,
    } = req.body;

    if (!audioData) {
      return res.status(400).json({
        error: 'Dữ liệu không hợp lệ',
        message: 'Không tìm thấy dữ liệu âm thanh/video trong yêu cầu.',
      });
    }

    const cleanBase64 = audioData.includes(',') ? audioData.split(',')[1] : audioData;

    let mediaPart: any = {
      inlineData: {
        mimeType: mimeType || 'audio/webm',
        data: cleanBase64,
      },
    };

    const systemPrompt = buildTranscriptionPrompt({ language, mode, punctuate, speakerDiarization, timestamps });
    const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-3.5-transcribe'];
    let responseText = '';
    let lastModelError: any = null;

    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: {
            parts: [
              mediaPart,
              {
                text: `${systemPrompt}\n\nHãy lắng nghe tệp âm thanh này và phiên âm chi tiết thành JSON theo đúng schema trên.`,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
          },
        });
        const text = (response.text || '').trim();
        if (text) {
          responseText = text;
          break;
        }
      } catch (err: any) {
        lastModelError = err;
        console.warn(`Direct model ${model} attempt failed:`, err?.message);
      }
    }

    if (!responseText && lastModelError) {
      throw lastModelError;
    }

    const parsedData = parseTranscriptionResult(responseText, language);
    return res.json({
      success: true,
      fileName,
      detectedLanguage: parsedData.detectedLanguage,
      summary: parsedData.summary,
      fullText: parsedData.fullText,
      segments: parsedData.segments,
      stats: parsedData.stats,
    });
  } catch (err: any) {
    console.error('Direct transcription error:', err);
    return res.status(500).json({
      error: 'Lỗi trong quá trình phiên âm',
      message: err?.message || 'Đã xảy ra lỗi không xác định khi kết nối với mô hình AI.',
    });
  }
});

// Global error handling middleware - guarantees all API errors return clean JSON instead of HTML
app.use((err: any, _req: Request, res: Response, next: any) => {
  if (res.headersSent) {
    return next(err);
  }
  if (err?.type === 'entity.too.large' || err?.status === 413) {
    return res.status(413).json({
      error: 'Tệp quá lớn',
      message: 'Dung lượng tệp vượt quá giới hạn truyền tải của máy chủ. Vui lòng nén tệp hoặc chọn đoạn ngắn hơn.',
    });
  }
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      error: 'Dữ liệu không hợp lệ',
      message: 'Cú pháp gửi lên máy chủ không đúng định dạng JSON.',
    });
  }
  console.error('[Server Error Handler]:', err);
  return res.status(500).json({
    error: 'Lỗi máy chủ',
    message: err.message || 'Đã xảy ra lỗi nội bộ trên máy chủ.',
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VoiceText AI Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
