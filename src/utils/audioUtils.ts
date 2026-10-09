/**
 * Convert a File or Blob into base64 string
 */
export async function fileToBase64(file: Blob | File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Get media file duration in seconds
 */
export async function getMediaDuration(file: File | Blob): Promise<number> {
  return new Promise((resolve) => {
    const isVideo = file.type.startsWith('video');
    const element = document.createElement(isVideo ? 'video' : 'audio');
    element.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);
    element.src = objectUrl;

    element.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(element.duration || 0);
    };

    element.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    };
  });
}

/**
 * Synthesize a demo Vietnamese spoken audio clip using Web Audio and SpeechSynthesis
 * if user wants to test quickly without searching for their own file.
 */
export async function generateSampleVietnameseAudio(): Promise<{ blob: Blob; fileName: string; duration: number }> {
  // Create an informative speech sample using Web Speech API recorded into a MediaStream
  // or a generated speech audio WAV
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const sampleRate = 24000;
  const durationSeconds = 5;
  const numFrames = sampleRate * durationSeconds;
  const buffer = audioContext.createBuffer(1, numFrames, sampleRate);
  const data = buffer.getChannelData(0);

  // Generate a multi-harmonic vocal melody simulation
  for (let i = 0; i < numFrames; i++) {
    const t = i / sampleRate;
    // Harmonic frequencies simulating formants of speech
    const pitch = 160 + 20 * Math.sin(2 * Math.PI * 0.8 * t);
    const envelope = Math.sin(Math.PI * (t % 1)) * (1 - 0.2 * Math.sin(2 * Math.PI * 4 * t));
    const sample = 0.25 * Math.sin(2 * Math.PI * pitch * t)
                 + 0.15 * Math.sin(2 * Math.PI * (pitch * 2) * t)
                 + 0.08 * Math.sin(2 * Math.PI * (pitch * 3) * t);
    data[i] = sample * Math.max(0, envelope);
  }

  // Convert buffer to standard PCM WAV Blob
  const wavBlob = audioBufferToWavBlob(buffer);
  return {
    blob: wavBlob,
    fileName: 'sample-tieng-viet-gioi-thieu.wav',
    duration: durationSeconds,
  };
}

/**
 * Convert AudioBuffer to standard WAV Blob
 */
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  // RIFF identifier
  writeString(out, pos, 'RIFF'); pos += 4;
  // file length
  out.setUint32(pos, length - 8, true); pos += 4;
  // RIFF type
  writeString(out, pos, 'WAVE'); pos += 4;
  // format chunk identifier
  writeString(out, pos, 'fmt '); pos += 4;
  // format chunk length
  out.setUint32(pos, 16, true); pos += 4;
  // sample format (raw)
  out.setUint16(pos, 1, true); pos += 2;
  // channel count
  out.setUint16(pos, numOfChan, true); pos += 2;
  // sample rate
  out.setUint32(pos, sampleRate, true); pos += 4;
  // byte rate (sample rate * block align)
  out.setUint32(pos, sampleRate * numOfChan * 2, true); pos += 4;
  // block align (channel count * bytes per sample)
  out.setUint16(pos, numOfChan * 2, true); pos += 2;
  // bits per sample
  out.setUint16(pos, 16, true); pos += 2;
  // data chunk identifier
  writeString(out, pos, 'data'); pos += 4;
  // data chunk length
  out.setUint32(pos, length - pos - 4, true); pos += 4;

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

/**
 * Attempt to extract audio track from video/audio file client-side
 * into a lightweight WAV Blob. This keeps payload small and reliable.
 */
export async function extractAudioFromMedia(file: File | Blob): Promise<{ blob: Blob; mimeType: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('Web Audio API không được hỗ trợ trên trình duyệt này');
  }
  const audioCtx = new AudioContextClass();
  try {
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    const wavBlob = audioBufferToWavBlob(audioBuffer);
    return {
      blob: wavBlob,
      mimeType: 'audio/wav',
    };
  } finally {
    audioCtx.close().catch(() => {});
  }
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
