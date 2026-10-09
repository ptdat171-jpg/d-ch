import React from 'react';
import {
  Clock,
  GraduationCap,
  Briefcase,
  Sliders,
  Laptop,
  CheckCircle2,
  FileCheck
} from 'lucide-react';

export const BenefitsSection: React.FC = () => {
  const benefits = [
    {
      title: 'Tiết kiệm thời gian ghi chép thủ công',
      description: 'Thay vì mất hàng giờ ngồi nghe lại và gõ từng câu chữ, hệ thống tự động trích xuất toàn bộ văn bản trong vài phút, giúp bạn tập trung vào phân tích và xử lý công việc.',
      icon: Clock,
      tag: 'Hiệu suất cao',
    },
    {
      title: 'Hỗ trợ học tập & ghi chép bài giảng',
      description: 'Sinh viên và giáo viên dễ dàng chuyển các buổi thuyết trình, bài giảng ghi âm thành tài liệu ôn tập có thể tìm kiếm từ khóa và tra cứu tức thì.',
      icon: GraduationCap,
      tag: 'Giáo dục',
    },
    {
      title: 'Biên bản cuộc họp & thảo luận nhóm',
      description: 'Ghi lại mọi ý kiến đóng góp trong cuộc họp công ty hoặc phỏng vấn nghiên cứu với tính năng tách người nói tự động, không lo bỏ sót ý kiến quan trọng.',
      icon: Briefcase,
      tag: 'Văn phòng',
    },
    {
      title: 'Toàn quyền kiểm soát & chỉnh sửa',
      description: 'Mọi bản phiên âm đều có thể chỉnh sửa trực tiếp từng phân đoạn, sửa tên người nói và xuất sang các định dạng chuẩn Word, TXT hoặc phụ đề SRT.',
      icon: Sliders,
      tag: 'Linh hoạt',
    },
    {
      title: 'Tương thích mượt mà trên mọi thiết bị',
      description: 'Hoạt động trực tiếp trên trình duyệt máy tính xách tay, máy tính để bàn, máy tính bảng và điện thoại di động mà không cần cài đặt thêm ứng dụng nặng.',
      icon: Laptop,
      tag: 'Tiện lợi',
    },
    {
      title: 'Cam kết chất lượng & rà soát minh bạch',
      description: 'Hệ thống hỗ trợ trình phát đồng bộ âm thanh giúp bạn dễ dàng đối chiếu và rà soát từng câu phát biểu trước khi chia sẻ tài liệu chính thức.',
      icon: FileCheck,
      tag: 'Minh bạch',
    },
  ];

  return (
    <section id="benefits" className="py-16 sm:py-20 bg-slate-50/50 border-t border-slate-200/80 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <span className="text-xs uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Giá trị thực tế
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-4 tracking-tight">
            Lợi ích nổi bật của VoiceText AI
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Thiết kế để giải quyết nhu cầu thực tế của người dùng: từ giảng viên, sinh viên đến chuyên viên văn phòng và người làm nội dung podcast.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50/80 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Dễ dàng kiểm tra và rà soát lại</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
