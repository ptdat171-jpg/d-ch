import React from 'react';
import { UploadCloud, Cpu, Download, ArrowRight } from 'lucide-react';

export const WorkflowSection: React.FC = () => {
  const steps = [
    {
      number: '01',
      title: 'Tải lên hoặc ghi âm',
      description: 'Kéo thả tệp âm thanh/video từ máy tính của bạn (MP3, WAV, MP4...) hoặc bật microphone để ghi âm trực tiếp ngay trên trình duyệt.',
      icon: UploadCloud,
      badgeColor: 'bg-indigo-600',
    },
    {
      number: '02',
      title: 'AI xử lý và phiên âm',
      description: 'Mô hình AI phân tích âm thanh, nhận diện ngôn ngữ tiếng Việt chính xác, tách người nói và gắn nhãn mốc thời gian từng câu.',
      icon: Cpu,
      badgeColor: 'bg-blue-600',
    },
    {
      number: '03',
      title: 'Chỉnh sửa và xuất kết quả',
      description: 'Xem văn bản đồng bộ với trình phát âm thanh, sửa đổi nội dung nếu cần, tìm kiếm từ khóa và tải về dưới dạng TXT, Word hoặc SRT.',
      icon: Download,
      badgeColor: 'bg-emerald-600',
    },
  ];

  return (
    <section id="how-it-works" className="py-16 sm:py-20 bg-white border-t border-slate-200/80 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <span className="text-xs uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Đơn giản & Nhanh chóng
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-4 tracking-tight">
            Quy trình 3 bước hoạt động
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Không cần cài đặt phức tạp, không yêu cầu kỹ năng kỹ thuật. Bạn chỉ cần vài cú nhấp chuột để hoàn tất một bản phiên âm trọn vẹn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative bg-slate-50/70 rounded-2xl p-7 border border-slate-200/90 hover:border-indigo-200 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-white text-indigo-600 border border-slate-200 flex items-center justify-center shadow-sm">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-2xl font-black text-slate-300">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center text-xs font-semibold text-indigo-600">
                  <span>Bước {step.number}</span>
                  {idx < 2 && (
                    <ArrowRight className="w-3.5 h-3.5 ml-auto text-slate-400 hidden md:block" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
