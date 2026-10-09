import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  Mic,
  Link as LinkIcon,
  FileAudio,
  FileVideo,
  Play,
  Pause,
  Square,
  RotateCcw,
  Sparkles,
  Settings2,
  AlertTriangle,
  X,
  Volume2,
  Clock,
  HardDrive,
  Info,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { TranscribeOptions, TranscriptResult, ServerStatus } from '../types';
import { fileToBase64, getMediaDuration, generateSampleVietnameseAudio, extractAudioFromMedia } from '../utils/audioUtils';
import { formatTimeDisplay, formatFileSize } from '../utils/exportHelpers';
import { useToast } from './Toast';

interface ConverterCardProps {
  serverStatus: ServerStatus | null;
  onTranscriptionComplete: (result: TranscriptResult) => void;
  initialTab?: 'upload' | 'record' | 'url';
}

export const ConverterCard: React.FC<ConverterCardProps> = ({
  serverStatus,
  onTranscriptionComplete,
  initialTab = 'upload',
}) => {
  const { showToast } = useToast();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'upload' | 'record' | 'url'>(initialTab);

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDuration, setFileDuration] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState<boolean>(false);

  // URL Tab State
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [urlError, setUrlError] = useState<string | null>(null);

  // Transcription Options State
  const [options, setOptions] = useState<TranscribeOptions>({
    language: 'auto',
    mode: 'clean',
    punctuate: true,
    speakerDiarization: true,
    timestamps: true,
  });
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);

  // Processing State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeUploadIdRef = useRef<string | null>(null);

  // Clean up recorded audio object URL
  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }
    };
  }, [recordedAudioUrl]);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSetFile = async (file: File) => {
    setErrorMessage(null);

    // Size limit check (Up to 500 MB max supported via Chunked Resumable Upload)
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > 500) {
      setErrorMessage(`Tệp có dung lượng ${sizeInMB.toFixed(1)}MB, vượt quá giới hạn tối đa cho phép (500MB). Vui lòng chọn tệp nhỏ hơn.`);
      showToast('Dung lượng tệp vượt quá 500MB', 'error');
      return;
    }

    // MIME type & format check
    const validMimes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/x-wav',
      'audio/m4a',
      'audio/x-m4a',
      'audio/flac',
      'audio/x-flac',
      'audio/ogg',
      'audio/webm',
      'audio/aac',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-matroska',
      'video/mov',
    ];

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const validExts = ['mp3', 'wav', 'm4a', 'flac', 'ogg', 'aac', 'mp4', 'webm', 'mov', 'mkv'];

    if (!validMimes.some((m) => file.type.includes(m)) && !validExts.includes(ext)) {
      setErrorMessage('Định dạng tệp không được hỗ trợ. Vui lòng chọn tệp âm thanh (MP3, WAV, M4A, FLAC, OGG, AAC) hoặc video (MP4, MOV, WEBM).');
      showToast('Định dạng tệp không hợp lệ', 'error');
      return;
    }

    setSelectedFile(file);
    try {
      const duration = await getMediaDuration(file);
      setFileDuration(duration);
    } catch {
      setFileDuration(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFileDuration(0);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Microphone Recording Handlers
  const startRecording = async () => {
    setMicError(null);
    setRecordedBlob(null);
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      const mediaRecorder = MediaRecorder.isTypeSupported('audio/webm')
        ? new MediaRecorder(stream, options)
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);

        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250); // Slice into chunks every 250ms
      setIsRecording(true);
      setIsPaused(false);
      setRecordingSeconds(0);

      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      let errorMsg = 'Không thể truy cập microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Quyền truy cập microphone đã bị từ chối. Vui lòng cho phép quyền microphone trên trình duyệt để ghi âm.';
      } else if (err.name === 'NotFoundError') {
        errorMsg = 'Không tìm thấy thiết bị microphone nào trên máy của bạn.';
      }
      setMicError(errorMsg);
      showToast(errorMsg, 'error');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      clearInterval(recordTimerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      clearInterval(recordTimerRef.current);
    }
  };

  const resetRecording = () => {
    stopRecording();
    setRecordedBlob(null);
    if (recordedAudioUrl) {
      URL.revokeObjectURL(recordedAudioUrl);
      setRecordedAudioUrl(null);
    }
    setRecordingSeconds(0);
    setMicError(null);
  };

  const togglePreviewPlay = () => {
    if (!audioPreviewRef.current) return;
    if (isPreviewPlaying) {
      audioPreviewRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      audioPreviewRef.current.play();
      setIsPreviewPlaying(true);
    }
  };

  // Sample Audio Handler
  const handleLoadSample = async () => {
    try {
      setErrorMessage(null);
      const sample = await generateSampleVietnameseAudio();
      const sampleFile = new File([sample.blob], sample.fileName, { type: 'audio/wav' });
      setSelectedFile(sampleFile);
      setFileDuration(sample.duration);
      setActiveTab('upload');
      showToast('Đã tải mẫu âm thanh tiếng Việt để thử nghiệm!', 'info');
    } catch (err) {
      showToast('Không thể tạo âm thanh mẫu', 'error');
    }
  };

  // Main Submit Handler
  const handleStartTranscribe = async () => {
    setErrorMessage(null);

    // Determine target media source
    let targetBlob: Blob | null = null;
    let targetFileName = 'audio-recording';
    let targetMimeType = 'audio/mp3';
    let mediaType: 'audio' | 'video' = 'audio';

    if (activeTab === 'upload') {
      if (!selectedFile) {
        setErrorMessage('Vui lòng chọn hoặc kéo thả tệp âm thanh/video để bắt đầu.');
        showToast('Vui lòng chọn tệp trước khi chuyển đổi', 'error');
        return;
      }
      targetBlob = selectedFile;
      targetFileName = selectedFile.name;
      targetMimeType = selectedFile.type || 'audio/mp3';
      if (selectedFile.type.startsWith('video') || selectedFile.name.match(/\.(mp4|webm|mov)$/i)) {
        mediaType = 'video';
      }
    } else if (activeTab === 'record') {
      if (!recordedBlob) {
        setErrorMessage('Vui lòng hoàn thành một bản ghi âm trước khi chuyển đổi.');
        showToast('Chưa có bản ghi âm nào', 'error');
        return;
      }
      targetBlob = recordedBlob;
      targetFileName = `Ghi-am-${new Date().toISOString().slice(0, 10)}.webm`;
      targetMimeType = recordedBlob.type || 'audio/webm';
    } else if (activeTab === 'url') {
      if (!videoUrl.trim()) {
        setUrlError('Vui lòng nhập đường dẫn URL của video hoặc âm thanh.');
        return;
      }

      // Check if it's a direct media URL (ending with .mp4, .mp3, etc.)
      const isDirectMedia = videoUrl.match(/\.(mp4|mp3|wav|m4a|webm|ogg)($|\?)/i);
      if (!isDirectMedia) {
        setUrlError(
          'Đường dẫn URL bên thứ ba (như YouTube, TikTok, Facebook) yêu cầu quyền tải trực tiếp. Để đảm bảo chất lượng và quyền riêng tư, vui lòng tải video/âm thanh về máy của bạn và kéo thả vào tab "Tải tệp".'
        );
        return;
      }

      // If it is a direct URL, attempt to fetch client-side
      setProcessingStage('Đang kết nối tải luồng media từ URL...');
      setIsProcessing(true);
      try {
        const fetched = await fetch(videoUrl);
        if (!fetched.ok) throw new Error(`HTTP ${fetched.status}: Không thể tải tệp từ URL cung cấp`);
        const blob = await fetched.blob();
        targetBlob = blob;
        targetFileName = videoUrl.split('/').pop()?.split('?')[0] || 'media-from-url.mp4';
        targetMimeType = blob.type || 'video/mp4';
        if (blob.type.startsWith('video')) mediaType = 'video';
      } catch (err: any) {
        setIsProcessing(false);
        setUrlError(`Không thể truy cập URL do chính sách CORS hoặc kết nối: ${err.message}. Vui lòng tải tệp về máy và dùng tab "Tải tệp".`);
        return;
      }
    }

    if (!targetBlob) return;

    // Retain original media blob for playback preview (especially video)
    const originalMediaBlob = targetBlob;

    // Check backend API key warning
    if (serverStatus && !serverStatus.configured) {
      setErrorMessage(
        'Máy chủ chưa cấu hình GEMINI_API_KEY. Vui lòng thiết lập biến môi trường GEMINI_API_KEY trong file .env hoặc bảng Secrets của AI Studio để sử dụng mô hình Gemini Speech-to-Text thực tế.'
      );
      showToast('Cần cấu hình GEMINI_API_KEY trên server', 'error');
      return;
    }

    setIsProcessing(true);
    setProcessingStage('Đang khởi tạo phiên tải lên bảo mật...');

    // Prepare abort controller for cancellation
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // 1. Initialize Chunked Upload
      const initRes = await fetch('/api/upload/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          fileName: targetFileName,
          fileSize: targetBlob.size,
          mimeType: targetMimeType,
        }),
      });

      const initContentType = initRes.headers.get('content-type') || '';
      if (!initContentType.includes('application/json')) {
        const rawInit = await initRes.text();
        console.error('[API Init Non-JSON Response]:', initRes.status, rawInit.slice(0, 300));
        throw new Error(`Máy chủ phản hồi không đúng định dạng (HTTP ${initRes.status}). Vui lòng thử lại.`);
      }

      const initData = await initRes.json();
      if (!initRes.ok || !initData.success) {
        throw new Error(initData?.message || initData?.error || 'Không thể khởi tạo phiên tải lên.');
      }

      const uploadId = initData.uploadId;
      activeUploadIdRef.current = uploadId;
      const chunkSize = initData.chunkSize || 4 * 1024 * 1024; // 4 MB chunks
      const totalChunks = Math.ceil(targetBlob.size / chunkSize);

      // 2. Upload in sequential chunks (safely below 32MB Cloud Run limit)
      for (let i = 0; i < totalChunks; i++) {
        if (controller.signal.aborted) {
          throw new Error('AbortError');
        }

        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, targetBlob.size);
        const chunkBlob = targetBlob.slice(start, end);

        const currentBytes = start + chunkBlob.size;
        const percent = Math.min(100, Math.round((currentBytes / targetBlob.size) * 100));
        const currentMB = (currentBytes / (1024 * 1024)).toFixed(1);
        const totalMB = (targetBlob.size / (1024 * 1024)).toFixed(1);

        setProcessingStage(`Đang tải lên máy chủ: ${percent}% (${currentMB}MB / ${totalMB}MB)...`);

        const chunkRes = await fetch('/api/upload/chunk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'x-upload-id': uploadId,
            'x-chunk-index': i.toString(),
            'x-total-chunks': totalChunks.toString(),
          },
          signal: controller.signal,
          body: chunkBlob,
        });

        const chunkContentType = chunkRes.headers.get('content-type') || '';
        if (!chunkRes.ok) {
          let chunkErrMsg = `Lỗi tải lên đoạn ${i + 1}/${totalChunks}`;
          if (chunkContentType.includes('application/json')) {
            const chunkErrData = await chunkRes.json();
            chunkErrMsg = chunkErrData.message || chunkErrData.error || chunkErrMsg;
          }
          throw new Error(chunkErrMsg);
        }
      }

      // 3. Trigger server-side FFmpeg extraction & Gemini transcription
      if (mediaType === 'video') {
        setProcessingStage('Đang trích xuất luồng âm thanh từ video với FFmpeg...');
      } else {
        setProcessingStage('Đang gửi dữ liệu âm thanh đến mô hình AI...');
      }

      const stageTimer1 = setTimeout(() => {
        setProcessingStage('Mô hình Gemini AI đang lắng nghe và nhận diện tiếng nói...');
      }, 3000);

      const stageTimer2 = setTimeout(() => {
        setProcessingStage('Đang phân tách người nói, chuẩn hóa ngữ pháp và đánh dấu thời gian...');
      }, 7500);

      const stageTimer3 = setTimeout(() => {
        setProcessingStage('Đang hoàn thiện và xuất bản kết quả phiên âm...');
      }, 15000);

      const transcribeRes = await fetch('/api/upload/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          uploadId,
          language: options.language,
          mode: options.mode,
          punctuate: options.punctuate,
          speakerDiarization: options.speakerDiarization,
          timestamps: options.timestamps,
        }),
      });

      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      activeUploadIdRef.current = null;

      // SAFE RESPONSE HANDLING - Inspect Content-Type before parsing JSON
      const contentType = transcribeRes.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        try {
          data = await transcribeRes.json();
        } catch (jsonErr) {
          console.error('Failed to parse JSON response:', jsonErr);
          throw new Error('Máy chủ phản hồi dữ liệu không đúng định dạng JSON. Vui lòng thử lại.');
        }
      } else {
        // Non-JSON response received (e.g. HTML 413, 502, 504 from cloud proxy)
        const rawText = await transcribeRes.text();
        console.error(`[API Non-JSON Response] Status: ${transcribeRes.status}, Content-Type: ${contentType}`, rawText.slice(0, 300));

        if (transcribeRes.status === 413) {
          throw new Error('Dung lượng tệp vượt quá giới hạn truyền tải của máy chủ.');
        }
        if (transcribeRes.status === 502 || transcribeRes.status === 504) {
          throw new Error('Máy chủ phản hồi quá thời gian chờ (Gateway Timeout). Tệp có thể quá dài, vui lòng thử lại.');
        }
        if (transcribeRes.status === 404) {
          throw new Error('Không tìm thấy đường dẫn xử lý phiên âm trên máy chủ.');
        }
        throw new Error(`Máy chủ gặp sự cố (mã lỗi HTTP ${transcribeRes.status}). Vui lòng thử lại.`);
      }

      if (!transcribeRes.ok || !data.success) {
        throw new Error(data?.message || data?.error || `Lỗi máy chủ (${transcribeRes.status})`);
      }

      setProcessingStage('Hoàn tất phiên âm!');

      // Create playback object URL using the original media (video or audio)
      const mediaUrl = URL.createObjectURL(originalMediaBlob);

      const result: TranscriptResult = {
        fileName: targetFileName,
        detectedLanguage: data.detectedLanguage || 'Tiếng Việt',
        summary: data.summary || '',
        fullText: data.fullText,
        segments: data.segments,
        stats: data.stats,
        mediaUrl,
        mediaType,
      };

      showToast('Phiên âm hoàn tất thành công!', 'success');
      onTranscriptionComplete(result);
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message === 'AbortError') {
        showToast('Đã hủy quá trình phiên âm', 'info');
      } else {
        console.error('Transcription error:', err);
        const msg = err.message || 'Đã có lỗi xảy ra trong quá trình phiên âm.';
        setErrorMessage(msg);
        showToast(msg, 'error');
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
      activeUploadIdRef.current = null;
    }
  };

  const handleCancel = () => {
    if (activeUploadIdRef.current) {
      const idToCancel = activeUploadIdRef.current;
      activeUploadIdRef.current = null;
      fetch('/api/upload/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId: idToCancel }),
      }).catch(() => {});
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
  };

  return (
    <div
      id="converter"
      className="max-w-4xl mx-auto px-4 sm:px-6 mb-16 scroll-mt-24 transition-all"
    >
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/40 overflow-hidden">
        {/* Converter Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 sm:p-2 gap-1.5">
          <button
            onClick={() => {
              setActiveTab('upload');
              setErrorMessage(null);
            }}
            disabled={isProcessing}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Tải tệp</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('record');
              setErrorMessage(null);
            }}
            disabled={isProcessing}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'record'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Ghi âm trực tiếp</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('url');
              setErrorMessage(null);
            }}
            disabled={isProcessing}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'url'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Đường dẫn video</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 sm:p-8">
          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div className="space-y-4">
              {!selectedFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/70 bg-slate-50/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".mp3,.wav,.m4a,.flac,.ogg,.aac,.mp4,.webm,.mov,.mkv,audio/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center mb-4 shadow-inner">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
                    Kéo thả tệp âm thanh hoặc video vào đây
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    hoặc <span className="text-indigo-600 font-semibold underline underline-offset-2">chọn tệp từ thiết bị</span>
                  </p>
                  <div className="inline-flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">MP3</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">WAV</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">M4A</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">FLAC</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">OGG</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">MP4</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">MOV</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">WEBM</span>
                    <span className="text-slate-400 font-medium">• Tối đa 500MB</span>
                  </div>
                </div>
              ) : (
                /* Selected File Card */
                <div className="border border-indigo-100 bg-indigo-50/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                      {selectedFile.type.startsWith('video') ? (
                        <FileVideo className="w-6 h-6" />
                      ) : (
                        <FileAudio className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 break-all line-clamp-1">
                        {selectedFile.name}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <HardDrive className="w-3.5 h-3.5" />
                          {formatFileSize(selectedFile.size)}
                        </span>
                        {fileDuration > 0 && (
                          <span className="flex items-center gap-1 text-indigo-600 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTimeDisplay(fileDuration)}
                          </span>
                        )}
                        <span className="uppercase text-[11px] font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                          {selectedFile.name.split('.').pop()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Thay tệp khác
                    </button>
                    <button
                      type="button"
                      onClick={clearSelectedFile}
                      disabled={isProcessing}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Xóa tệp"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Sample audio button */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Chưa có tệp âm thanh sẵn sàng?</span>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  disabled={isProcessing}
                  className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 hover:underline"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Thử mẫu âm thanh tiếng Việt
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE RECORDING */}
          {activeTab === 'record' && (
            <div className="py-6 sm:py-8 text-center">
              {micError && (
                <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm text-left flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
                  <div>
                    <strong className="font-semibold block mb-0.5">Lỗi Microphone</strong>
                    {micError}
                  </div>
                </div>
              )}

              {/* Timer Display */}
              <div className="mb-6">
                <div
                  className={`inline-flex items-center justify-center font-mono text-4xl sm:text-5xl font-bold tracking-tight ${
                    isRecording && !isPaused ? 'text-indigo-600' : 'text-slate-700'
                  }`}
                >
                  {formatTimeDisplay(recordingSeconds)}
                </div>
                <div className="text-xs text-slate-500 mt-2 font-medium">
                  {isRecording ? (
                    isPaused ? (
                      <span className="text-amber-600 font-semibold">Đang tạm dừng ghi âm</span>
                    ) : (
                      <span className="text-emerald-600 font-semibold flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        Đang ghi âm qua Microphone...
                      </span>
                    )
                  ) : recordedBlob ? (
                    <span className="text-indigo-600 font-semibold">Bản ghi đã sẵn sàng</span>
                  ) : (
                    'Nhấn nút bên dưới để bắt đầu ghi âm trực tiếp'
                  )}
                </div>
              </div>

              {/* Recording Controls */}
              <div className="flex items-center justify-center gap-3">
                {!isRecording && !recordedBlob && (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="px-6 py-3.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 hover:scale-105 transition-all"
                  >
                    <Mic className="w-5 h-5" />
                    <span>Bắt đầu ghi âm</span>
                  </button>
                )}

                {isRecording && (
                  <>
                    {!isPaused ? (
                      <button
                        type="button"
                        onClick={pauseRecording}
                        className="p-3.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all"
                        title="Tạm dừng"
                      >
                        <Pause className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={resumeRecording}
                        className="p-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all"
                        title="Tiếp tục ghi âm"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-5 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md flex items-center gap-2 transition-all"
                      title="Kết thúc ghi âm"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Kết thúc ghi âm</span>
                    </button>
                  </>
                )}

                {!isRecording && recordedBlob && (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {/* Audio preview playback */}
                    {recordedAudioUrl && (
                      <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2 border border-slate-200">
                        <audio
                          ref={audioPreviewRef}
                          src={recordedAudioUrl}
                          onEnded={() => setIsPreviewPlaying(false)}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={togglePreviewPlay}
                          className="p-2 rounded-lg bg-white text-indigo-600 hover:bg-indigo-50 shadow-sm"
                        >
                          {isPreviewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <span className="text-xs text-slate-600 font-medium">Nghe lại bản ghi ({formatTimeDisplay(recordingSeconds)})</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={resetRecording}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Ghi âm lại</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: VIDEO URL */}
          {activeTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Đường dẫn video / âm thanh
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={videoUrl}
                    onChange={(e) => {
                      setVideoUrl(e.target.value);
                      setUrlError(null);
                    }}
                    placeholder="https://example.com/podcast-episode-01.mp4"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-800 placeholder-slate-400 bg-slate-50/40"
                  />
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {urlError && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>{urlError}</div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-600" />
                  Quy định truy cập đường dẫn URL:
                </p>
                <p>
                  • Hỗ trợ các liên kết tải trực tiếp tệp âm thanh/video công khai (.mp4, .mp3, .wav, .webm, .m4a).
                </p>
                <p>
                  • Nếu video nằm trên các nền tảng có chính sách bảo vệ luồng dữ liệu (YouTube, Facebook, TikTok), vui lòng tải video về máy tính và chuyển sang tab <strong>"Tải tệp"</strong> để phiên âm nhanh chóng và an toàn.
                </p>
              </div>
            </div>
          )}

          {/* TRANSCRIPTION SETTINGS */}
          <div className="mt-6 pt-5 border-t border-slate-200/90">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors uppercase tracking-wider"
              >
                <Settings2 className="w-4 h-4 text-indigo-600" />
                <span>Thiết lập phiên âm</span>
                {showAdvancedOptions ? (
                  <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                )}
              </button>
              <span className="text-xs text-slate-600 font-medium">
                Ngôn ngữ: {options.language === 'auto' ? 'Tự động nhận diện' : options.language.toUpperCase()}
              </span>
            </div>

            {/* Always visible quick language select + collapsible full settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ngôn ngữ nói
                </label>
                <select
                  value={options.language}
                  onChange={(e) => setOptions({ ...options, language: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                >
                  <option value="auto">Tự động nhận diện ngôn ngữ (Khuyên dùng)</option>
                  <option value="vi">Tiếng Việt (Vietnam)</option>
                  <option value="en">English (Tiếng Anh)</option>
                  <option value="ja">日本語 (Tiếng Nhật)</option>
                  <option value="ko">한국어 (Tiếng Hàn)</option>
                  <option value="fr">Français (Tiếng Pháp)</option>
                  <option value="zh">中文 (Tiếng Trung)</option>
                  <option value="es">Español (Tiếng Tây Ban Nha)</option>
                  <option value="de">Deutsch (Tiếng Đức)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Chế độ văn bản
                </label>
                <select
                  value={options.mode}
                  onChange={(e) => setOptions({ ...options, mode: e.target.value as any })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                >
                  <option value="clean">Văn bản rõ ràng (Lược bỏ từ đệm, ậm ừ)</option>
                  <option value="verbatim">Nguyên văn (Giữ trọn từng từ đệm: ừm, à, uh)</option>
                </select>
              </div>
            </div>

            {/* Advanced Checkboxes */}
            {showAdvancedOptions && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <input
                    type="checkbox"
                    checked={options.punctuate}
                    onChange={(e) => setOptions({ ...options, punctuate: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-700">Dấu câu tự động</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <input
                    type="checkbox"
                    checked={options.speakerDiarization}
                    onChange={(e) => setOptions({ ...options, speakerDiarization: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-700">Nhận diện người nói</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
                  <input
                    type="checkbox"
                    checked={options.timestamps}
                    onChange={(e) => setOptions({ ...options, timestamps: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium text-slate-700">Dấu thời gian (Timestamps)</span>
                </label>
              </div>
            )}
          </div>

          {/* ERROR ALERT */}
          {errorMessage && (
            <div className="mt-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1">
                <strong className="font-semibold block mb-0.5">Không thể phiên âm</strong>
                <p>{errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-400 hover:text-rose-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ACTION BUTTON & PROCESSING STATE */}
          <div className="mt-6">
            {!isProcessing ? (
              <button
                type="button"
                onClick={handleStartTranscribe}
                className="w-full py-4 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 flex items-center justify-center gap-2.5 text-base transition-all group"
              >
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>Bắt đầu chuyển đổi</span>
              </button>
            ) : (
              <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Đang chuyển giọng nói thành văn bản...</h4>
                    <p className="text-xs text-indigo-700 mt-0.5">{processingStage}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-rose-600 hover:border-rose-200 text-xs font-semibold shadow-sm transition-all"
                >
                  Hủy bỏ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
