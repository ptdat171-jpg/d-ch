import { TranscriptSegment } from '../types';

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
export function formatTimeDisplay(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format seconds to SRT timestamp: 00:00:00,000
 */
export function formatSrtTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

/**
 * Format seconds to VTT timestamp: 00:00:00.000
 */
export function formatVttTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * Trigger file download helper
 */
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export to plain TXT
 */
export function exportToTxt(content: string, baseName: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, `${baseName}.txt`);
}

/**
 * Export to SRT subtitle format using real timestamps
 */
export function exportToSrt(segments: TranscriptSegment[], baseName: string) {
  let srtContent = '';
  segments.forEach((seg, idx) => {
    const startStr = formatSrtTimestamp(seg.start);
    const endStr = formatSrtTimestamp(Math.max(seg.end, seg.start + 0.5));
    const speakerPrefix = seg.speaker ? `[${seg.speaker}] ` : '';
    srtContent += `${idx + 1}\n${startStr} --> ${endStr}\n${speakerPrefix}${seg.text}\n\n`;
  });

  const blob = new Blob([srtContent.trim()], { type: 'text/srt;charset=utf-8' });
  downloadBlob(blob, `${baseName}.srt`);
}

/**
 * Export to WebVTT subtitle format
 */
export function exportToVtt(segments: TranscriptSegment[], baseName: string) {
  let vttContent = 'WEBVTT - Created by VoiceText AI\n\n';
  segments.forEach((seg, idx) => {
    const startStr = formatVttTimestamp(seg.start);
    const endStr = formatVttTimestamp(Math.max(seg.end, seg.start + 0.5));
    const speakerPrefix = seg.speaker ? `<v ${seg.speaker}>` : '';
    const speakerSuffix = seg.speaker ? `</v>` : '';
    vttContent += `${idx + 1}\n${startStr} --> ${endStr}\n${speakerPrefix}${seg.text}${speakerSuffix}\n\n`;
  });

  const blob = new Blob([vttContent.trim()], { type: 'text/vtt;charset=utf-8' });
  downloadBlob(blob, `${baseName}.vtt`);
}

/**
 * Export to Microsoft Word document (.doc/.docx compatible HTML blob)
 */
export function exportToDocx(segments: TranscriptSegment[], fullText: string, baseName: string) {
  const dateStr = new Date().toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let segmentsHtml = '';
  segments.forEach((seg) => {
    segmentsHtml += `
      <div style="margin-bottom: 12px; font-family: Calibri, sans-serif;">
        <span style="font-weight: bold; color: #2563eb;">${seg.speaker || 'Người nói'}</span>
        <span style="color: #64748b; font-size: 11pt; margin-left: 8px;">(${formatTimeDisplay(seg.start)} - ${formatTimeDisplay(seg.end)})</span>
        <p style="margin: 4px 0 0 0; font-size: 11pt; line-height: 1.5;">${seg.text}</p>
      </div>
    `;
  });

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>Bản phiên âm VoiceText AI - ${baseName}</title>
      <style>
        body { font-family: Calibri, 'Segoe UI', sans-serif; margin: 40px; color: #1e293b; }
        h1 { color: #1e3a8a; font-size: 20pt; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
        .meta { color: #64748b; font-size: 10pt; margin-bottom: 24px; }
      </style>
    </head>
    <body>
      <h1>Bản Phiên Âm VoiceText AI</h1>
      <div class="meta">
        <strong>Tệp nguồn:</strong> ${baseName} &nbsp;|&nbsp; 
        <strong>Ngày xuất:</strong> ${dateStr} &nbsp;|&nbsp; 
        <strong>Tạo bởi:</strong> VoiceText AI
      </div>
      <div>
        ${segmentsHtml}
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + html], {
    type: 'application/msword;charset=utf-8',
  });
  downloadBlob(blob, `${baseName}.doc`);
}

/**
 * Format bytes to human readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
