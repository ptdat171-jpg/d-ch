export type TranscriptionMode = 'clean' | 'verbatim';

export interface TranscribeOptions {
  language: string;
  mode: TranscriptionMode;
  punctuate: boolean;
  speakerDiarization: boolean;
  timestamps: boolean;
}

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  speaker: string;
  text: string;
}

export interface TranscriptStats {
  words: number;
  chars: number;
  segmentsCount: number;
  duration: number;
}

export interface TranscriptResult {
  fileName: string;
  detectedLanguage: string;
  summary?: string;
  fullText: string;
  segments: TranscriptSegment[];
  stats: TranscriptStats;
  mediaUrl?: string;
  mediaType: 'audio' | 'video';
}

export interface ServerStatus {
  status: string;
  configured: boolean;
  primaryModel: string;
  fallbackModel: string;
  supportedFormats: string[];
  maxSizeMB: number;
  chunkSizeMB?: number;
  chunkedUploadSupported?: boolean;
  ffmpegAvailable?: boolean;
}
