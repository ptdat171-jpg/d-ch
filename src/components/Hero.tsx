import React from 'react';
import { Sparkles, ArrowRight, FileAudio, Globe2, DownloadCloud, ShieldCheck } from 'lucide-react';

interface HeroProps {
  onStartTranscribing: () => void;
  onExploreFeatures: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartTranscribing, onExploreFeatures }) => {
  return (
    <section className="relative pt-8 pb-12 sm:pt-14 sm:pb-16 overflow-hidden">
      {/* Background soft ambient accents */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-indigo-100/50 via-blue-50/40 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Subtle badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs sm:text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Công nghệ Speech-to-Text thế hệ mới cho Tiếng Việt & Đa ngôn ngữ</span>
        </div>

        {/* Main Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-5">
          Chuyển giọng nói thành văn bản <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-800">
            bằng AI
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed mb-8">
          Phiên âm nhanh chóng các bài giảng, cuộc họp, podcast và video thành văn bản có thể chỉnh sửa, tìm kiếm và tải xuống.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-10">
          <button
            onClick={onStartTranscribing}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Bắt đầu phiên âm</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={onExploreFeatures}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all flex items-center justify-center gap-2"
          >
            <span>Khám phá tính năng</span>
          </button>
        </div>

        {/* 3 Pillars / Short facts below */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto text-left">
          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-slate-200/70 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <FileAudio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Nhiều định dạng</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                MP3, WAV, M4A, FLAC, OGG, video MP4, WebM và ghi âm micro.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-slate-200/70 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Tối ưu Tiếng Việt</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Nhận diện chính xác giọng nói Bắc - Trung - Nam và thuật ngữ chuyên ngành.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-xl bg-white border border-slate-200/70 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <DownloadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Chỉnh sửa & Xuất đa dạng</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Xuất tệp TXT, Word DOCX, phụ đề SRT và WebVTT có timestamp chuẩn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
