import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Rewind,
  Copy,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Sparkles,
  Volume2,
  Trash2,
  FileCode,
  Check,
  Edit3,
  List,
  AlignLeft,
  ArrowLeft
} from 'lucide-react';
import { TranscriptResult, TranscriptSegment } from '../types';
import {
  formatTimeDisplay,
  exportToTxt,
  exportToSrt,
  exportToVtt,
  exportToDocx,
} from '../utils/exportHelpers';
import { useToast } from './Toast';

interface TranscriptResultViewProps {
  result: TranscriptResult;
  onReset: () => void;
}

export const TranscriptResultView: React.FC<TranscriptResultViewProps> = ({
  result,
  onReset,
}) => {
  const { showToast } = useToast();

  // Segments state (editable)
  const [segments, setSegments] = useState<TranscriptSegment[]>(result.segments);
  const [fullText, setFullText] = useState<string>(result.fullText);

  // View mode: 'segments' or 'continuous'
  const [viewMode, setViewMode] = useState<'segments' | 'continuous'>('segments');

  // Media Player State
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(result.stats.duration || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [activeSegmentId, setActiveSegmentId] = useState<number | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);

  // Summary accordion state
  const [showSummary, setShowSummary] = useState<boolean>(Boolean(result.summary));

  // Sync media duration on metadata loaded
  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration || result.stats.duration);
    }
  };

  // Sync current time and active segment
  const handleTimeUpdate = () => {
    if (!mediaRef.current) return;
    const time = mediaRef.current.currentTime;
    setCurrentTime(time);

    // Find active segment
    const active = segments.find((seg) => time >= seg.start && time <= seg.end);
    if (active) {
      setActiveSegmentId(active.id);
    } else {
      setActiveSegmentId(null);
    }
  };

  // Media Controls
  const togglePlay = () => {
    if (!mediaRef.current) return;
    if (isPlaying) {
      mediaRef.current.pause();
      setIsPlaying(false);
    } else {
      mediaRef.current.play();
      setIsPlaying(true);
    }
  };

  const skipSeconds = (seconds: number) => {
    if (!mediaRef.current) return;
    mediaRef.current.currentTime = Math.max(
      0,
      Math.min(duration, mediaRef.current.currentTime + seconds)
    );
  };

  const seekTo = (time: number) => {
    if (!mediaRef.current) return;
    mediaRef.current.currentTime = time;
    if (!isPlaying) {
      mediaRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (mediaRef.current) {
      mediaRef.current.playbackRate = speed;
    }
  };

  // Segment editing handlers
  const handleSegmentTextChange = (id: number, newText: string) => {
    const updated = segments.map((seg) =>
      seg.id === id ? { ...seg, text: newText } : seg
    );
    setSegments(updated);
    setFullText(updated.map((s) => s.text).join(' '));
  };

  const handleSpeakerChange = (id: number, newSpeaker: string) => {
    const updated = segments.map((seg) =>
      seg.id === id ? { ...seg, speaker: newSpeaker } : seg
    );
    setSegments(updated);
  };

  const handleFullTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setFullText(newText);
  };

  // Recalculate stats dynamically
  const stats = useMemo(() => {
    const textToCount = viewMode === 'continuous' ? fullText : segments.map((s) => s.text).join(' ');
    const words = textToCount.trim() ? textToCount.trim().split(/\s+/).length : 0;
    const chars = textToCount.length;
    return {
      words,
      chars,
      segmentsCount: segments.length,
      duration: Math.round(duration),
    };
  }, [segments, fullText, viewMode, duration]);

  // Search matches
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const matches: { segmentId: number; indexInSegment: number }[] = [];

    segments.forEach((seg) => {
      let pos = seg.text.toLowerCase().indexOf(query);
      while (pos !== -1) {
        matches.push({ segmentId: seg.id, indexInSegment: pos });
        pos = seg.text.toLowerCase().indexOf(query, pos + 1);
      }
    });
    return matches;
  }, [searchQuery, segments]);

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    const target = searchMatches[nextIdx];
    const seg = segments.find((s) => s.id === target.segmentId);
    if (seg) seekTo(seg.start);
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIdx);
    const target = searchMatches[prevIdx];
    const seg = segments.find((s) => s.id === target.segmentId);
    if (seg) seekTo(seg.start);
  };

  // Export handlers
  const baseName = result.fileName.replace(/\.[^/.]+$/, '') || 'ban-phien-am-voicetext';

  const handleCopyText = async () => {
    const textToCopy =
      viewMode === 'continuous'
        ? fullText
        : segments.map((s) => `${s.speaker} [${formatTimeDisplay(s.start)}]: ${s.text}`).join('\n\n');
    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast('Đã sao chép toàn bộ văn bản vào bộ nhớ tạm!', 'success');
    } catch {
      showToast('Không thể sao chép văn bản', 'error');
    }
  };

  const handleExportTxt = () => {
    exportToTxt(fullText, baseName);
    showToast(`Đã xuất tệp ${baseName}.txt thành công!`, 'success');
  };

  const handleExportDocx = () => {
    exportToDocx(segments, fullText, baseName);
    showToast(`Đã xuất tệp Word ${baseName}.doc thành công!`, 'success');
  };

  const handleExportSrt = () => {
    exportToSrt(segments, baseName);
    showToast(`Đã xuất phụ đề ${baseName}.srt thành công!`, 'success');
  };

  const handleExportVtt = () => {
    exportToVtt(segments, baseName);
    showToast(`Đã xuất phụ đề ${baseName}.vtt thành công!`, 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 animate-in fade-in duration-300">
      {/* Top Banner & Return Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReset}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition-colors shadow-sm"
            title="Phiên âm tệp mới"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Đã phiên âm xong
              </span>
              <span className="text-xs font-medium text-slate-500">
                Ngôn ngữ: <strong>{result.detectedLanguage}</strong>
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5 truncate max-w-xl">
              {result.fileName}
            </h2>
          </div>
        </div>

        {/* Action Group: Copy & Exports */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleCopyText}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 shadow-sm hover:border-slate-300 transition-all"
          >
            <Copy className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sao chép</span>
          </button>

          <button
            type="button"
            onClick={handleExportTxt}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 shadow-sm hover:border-slate-300 transition-all"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600" />
            <span>Tải TXT</span>
          </button>

          <button
            type="button"
            onClick={handleExportDocx}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 shadow-sm hover:border-slate-300 transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Xuất Word</span>
          </button>

          <button
            type="button"
            onClick={handleExportSrt}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 shadow-sm hover:border-slate-300 transition-all"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-600" />
            <span>Xuất SRT</span>
          </button>

          <button
            type="button"
            onClick={handleExportVtt}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 shadow-sm hover:border-slate-300 transition-all"
          >
            <FileCode className="w-3.5 h-3.5 text-purple-600" />
            <span>Xuất VTT</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="px-3.5 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-xl flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Phiên âm mới</span>
          </button>
        </div>
      </div>

      {/* AI Summary Banner (if provided) */}
      {result.summary && (
        <div className="mb-6 bg-indigo-50/60 border border-indigo-100 rounded-2xl p-4 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Tóm tắt nội dung chính (AI Summary)</span>
            </div>
            <button
              type="button"
              onClick={() => setShowSummary(!showSummary)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
            >
              {showSummary ? 'Thu gọn' : 'Xem tóm tắt'}
              {showSummary ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
          {showSummary && (
            <p className="mt-2 text-sm text-indigo-950/80 leading-relaxed">
              {result.summary}
            </p>
          )}
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Media Player & Synchronized Timelines (5 Cols on LG) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sticky top-24 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-600" />
              <span>Trình phát đồng bộ</span>
            </h3>
            <span className="text-xs font-mono text-slate-500">
              {formatTimeDisplay(currentTime)} / {formatTimeDisplay(duration)}
            </span>
          </div>

          {/* Media Player element */}
          {result.mediaUrl && (
            <div className="space-y-4">
              {result.mediaType === 'video' ? (
                <div className="rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                  <video
                    ref={mediaRef as any}
                    src={result.mediaUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <audio
                  ref={mediaRef as any}
                  src={result.mediaUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              )}

              {/* Scrubber slider */}
              <div>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={currentTime}
                  onChange={(e) => {
                    const newTime = parseFloat(e.target.value);
                    setCurrentTime(newTime);
                    if (mediaRef.current) mediaRef.current.currentTime = newTime;
                  }}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-600 mt-1">
                  <span>{formatTimeDisplay(currentTime)}</span>
                  <span>{formatTimeDisplay(duration)}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-between pt-1">
                {/* Skip back 5s */}
                <button
                  type="button"
                  onClick={() => skipSeconds(-5)}
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Lùi 5 giây"
                >
                  <Rewind className="w-4 h-4" />
                </button>

                {/* Play/Pause */}
                <button
                  type="button"
                  onClick={togglePlay}
                  className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 transition-transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                {/* Skip forward 5s */}
                <button
                  type="button"
                  onClick={() => skipSeconds(5)}
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Tiến 5 giây"
                >
                  <FastForward className="w-4 h-4" />
                </button>

                {/* Playback Speed dropdown */}
                <div className="flex items-center gap-1">
                  {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => handleSpeedChange(speed)}
                      className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                        playbackSpeed === speed
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick interactive segment list */}
          <div>
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Mốc thời gian phát biểu</span>
              <span className="text-[11px] font-normal text-slate-600 lowercase">
                (Nhấn mốc để nhảy tới)
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {segments.map((seg) => {
                const isActive = activeSegmentId === seg.id;
                return (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => seekTo(seg.start)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 border ${
                      isActive
                        ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 font-medium shadow-sm'
                        : 'bg-slate-50/60 border-slate-100 hover:bg-slate-100/70 text-slate-700'
                    }`}
                  >
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white border border-slate-200 text-indigo-600 shrink-0">
                      {formatTimeDisplay(seg.start)}
                    </span>
                    <div className="truncate flex-1">
                      <span className="font-semibold mr-1.5 text-slate-900">
                        {seg.speaker}:
                      </span>
                      <span className="text-slate-600">{seg.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Transcript Editor (7 Cols on LG) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
          {/* Header of Editor with Search and View Mode */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Nội dung phiên âm
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span>{stats.words} từ</span>
                <span>•</span>
                <span>{stats.chars} ký tự</span>
                <span>•</span>
                <span>{stats.segmentsCount} phân đoạn</span>
              </div>
            </div>

            {/* Toggle view mode: Segments vs Continuous */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setViewMode('segments')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'segments'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Phân đoạn</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('continuous')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'continuous'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Văn bản liên tục</span>
              </button>
            </div>
          </div>

          {/* Search bar inside transcript */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentMatchIndex(0);
                }}
                placeholder="Tìm kiếm từ hoặc cụm từ trong bản phiên âm..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {searchQuery && (
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs text-slate-600">
                <span>
                  {searchMatches.length > 0
                    ? `${currentMatchIndex + 1}/${searchMatches.length}`
                    : '0 kết quả'}
                </span>
                <button
                  type="button"
                  onClick={handlePrevMatch}
                  disabled={searchMatches.length === 0}
                  className="p-1 hover:text-indigo-600 disabled:opacity-40"
                  title="Kết quả trước"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMatch}
                  disabled={searchMatches.length === 0}
                  className="p-1 hover:text-indigo-600 disabled:opacity-40"
                  title="Kết quả tiếp theo"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* TRANSCRIPT EDITOR CONTENT */}
          {viewMode === 'segments' ? (
            /* Segments View */
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {segments.map((seg) => {
                const isActive = activeSegmentId === seg.id;
                return (
                  <div
                    key={seg.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-indigo-50/50 border-indigo-300 ring-2 ring-indigo-500/10'
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {/* Editable Speaker Name */}
                        <input
                          type="text"
                          value={seg.speaker}
                          onChange={(e) => handleSpeakerChange(seg.id, e.target.value)}
                          className="font-bold text-xs text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/70 px-2 py-1 rounded-md border border-indigo-200/60 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          title="Nhấp để sửa tên người nói"
                        />
                        {/* Jump Timestamp button */}
                        <button
                          type="button"
                          onClick={() => seekTo(seg.start)}
                          className="font-mono text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-100 transition-colors"
                          title="Phát từ mốc này"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>
                            {formatTimeDisplay(seg.start)} - {formatTimeDisplay(seg.end)}
                          </span>
                        </button>
                      </div>

                      <span className="text-[11px] text-slate-400"># {seg.id}</span>
                    </div>

                    {/* Editable Segment Text */}
                    <textarea
                      value={seg.text}
                      onChange={(e) => handleSegmentTextChange(seg.id, e.target.value)}
                      rows={Math.max(2, Math.ceil(seg.text.length / 70))}
                      className="w-full text-sm text-slate-800 leading-relaxed bg-transparent resize-y border-none focus:outline-none focus:bg-slate-50/50 p-1 rounded-md transition-colors"
                      placeholder="Nội dung phát biểu..."
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            /* Continuous Text View */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Chỉnh sửa toàn văn bản liền mạch:</span>
                <span className="text-indigo-600 font-semibold flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5" />
                  Tự động đồng bộ
                </span>
              </div>
              <textarea
                value={fullText}
                onChange={handleFullTextChange}
                rows={16}
                className="w-full p-4 rounded-xl border border-slate-200 text-sm text-slate-800 leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/30 resize-y"
                placeholder="Nội dung toàn văn..."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
