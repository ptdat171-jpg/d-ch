import React from 'react';
import {
  FileAudio,
  FileVideo,
  Mic,
  Edit3,
  Subtitles,
  Download,
  ArrowRight
} from 'lucide-react';

interface ToolsShowcaseProps {
  onSelectTool: (tab: 'upload' | 'record' | 'url') => void;
}

export const ToolsShowcase: React.FC<ToolsShowcaseProps> = ({ onSelectTool }) => {
  const tools = [
    {
      id: 'audio-to-text',
      title: 'Audio to Text',
      name: 'Chuyển Audio thành Văn bản',
      description: 'Chuyển đổi các tệp ghi âm cuộc họp, bài giảng, podcast định dạng MP3, WAV, M4A thành văn bản có dấu câu chuẩn.',
      icon: FileAudio,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      action: () => onSelectTool('upload'),
      cta: 'Tải tệp âm thanh',
    },
    {
      id: 'video-to-text',
      title: 'Video to Text',
      name: 'Chuyển Video thành Văn bản',
      description: 'Trích xuất âm thanh từ video MP4, WebM và phiên âm chính xác lời thoại, hỗ trợ phân tách nhiều người nói.',
      icon: FileVideo,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
      action: () => onSelectTool('upload'),
      cta: 'Tải tệp video',
    },
    {
      id: 'voice-recorder',
      title: 'Voice Recorder',
      name: 'Ghi âm Trực tiếp bằng Micro',
      description: 'Ghi âm trực tiếp từ trình duyệt của bạn với microphone và nhận văn bản chuyển đổi tức thì không cần cài đặt phần mềm.',
      icon: Mic,
      color: 'bg-rose-50 text-rose-600 border-rose-100',
      action: () => onSelectTool('record'),
      cta: 'Bắt đầu ghi âm',
    },
    {
      id: 'transcript-editor',
      title: 'Transcript Editor',
      name: 'Trình biên tập Bản phiên âm',
      description: 'Chỉnh sửa trực tiếp từng phân đoạn, đổi tên người nói, tìm kiếm từ khóa và tự động lưu bản thảo an toàn.',
      icon: Edit3,
      color: 'bg-amber-50 text-amber-600 border-amber-100',
      action: () => onSelectTool('upload'),
      cta: 'Mở trình chỉnh sửa',
    },
    {
      id: 'subtitle-generator',
      title: 'Subtitle Generator',
      name: 'Tạo Phụ đề SRT & VTT',
      description: 'Tự động tạo tệp phụ đề chuẩn SubRip (.srt) và WebVTT (.vtt) với dấu thời gian thực tế khớp từng giây của video.',
      icon: Subtitles,
      color: 'bg-purple-50 text-purple-600 border-purple-100',
      action: () => onSelectTool('upload'),
      cta: 'Tạo phụ đề ngay',
    },
    {
      id: 'export-transcript',
      title: 'Export Transcript',
      name: 'Xuất Đa định dạng',
      description: 'Tải về bản phiên âm dưới định dạng Microsoft Word (.doc), văn bản thô (.txt) hoặc phụ đề để sử dụng ngay trong công việc.',
      icon: Download,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      action: () => onSelectTool('upload'),
      cta: 'Khám phá xuất tệp',
    },
  ];

  return (
    <section id="tools" className="py-16 sm:py-20 border-t border-slate-200/80 bg-slate-50/50 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Hệ sinh thái công cụ
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-4 tracking-tight">
            Khám phá bộ công cụ VoiceText AI
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Mọi tính năng cần thiết để biến âm thanh và video thành tài liệu văn bản chất lượng cao, phục vụ học tập, công việc và sản xuất nội dung.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 border ${tool.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {tool.title}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                    {tool.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={tool.action}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 flex items-center justify-center gap-1.5 transition-all group/btn"
                >
                  <span>{tool.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
