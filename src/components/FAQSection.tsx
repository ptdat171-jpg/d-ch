import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Website hỗ trợ định dạng âm thanh nào?',
      answer:
        'VoiceText AI hỗ trợ đầy đủ các định dạng âm thanh phổ biến hiện nay bao gồm MP3, WAV, M4A, FLAC, OGG, AAC, cũng như các tệp ghi âm trực tiếp từ microphone của trình duyệt. Bạn chỉ cần tải tệp lên hoặc kéo thả vào khung chuyển đổi.',
    },
    {
      question: 'Hệ thống có hỗ trợ tiếng Việt không?',
      answer:
        'Có. Tiếng Việt là một trong những ngôn ngữ được tối ưu hóa trọng tâm. Mô hình nhận diện chuẩn xác dấu thanh tiếng Việt (sắc, huyền, hỏi, ngã, nặng), ngữ pháp tự nhiên và thích ứng tốt với các giọng nói vùng miền Bắc, Trung, Nam cũng như thuật ngữ thông dụng.',
    },
    {
      question: 'Có thể phiên âm từ tệp video không?',
      answer:
        'Có. Bạn có thể tải lên các tệp video định dạng MP4, WebM, MOV. Hệ thống sẽ trích xuất phần âm thanh từ video và chuyển đổi thành văn bản đầy đủ với mốc thời gian (timestamps) và nhận diện người nói.',
    },
    {
      question: 'Làm thế nào để tải văn bản sau khi phiên âm xuống máy?',
      answer:
        'Sau khi quá trình phiên âm hoàn tất, bạn có thể sao chép toàn bộ văn bản vào bộ nhớ tạm bằng 1 cú nhấp chuột, hoặc xuất trực tiếp ra các tệp tài liệu: Văn bản thô (.txt), Microsoft Word (.doc), và phụ đề video (.srt, .vtt) với mốc thời gian thực.',
    },
    {
      question: 'Tôi có thể chỉnh sửa kết quả phiên âm không?',
      answer:
        'Hoàn toàn có thể. Trang kết quả cung cấp trình biên tập tương tác: bạn có thể nhấp vào bất kỳ câu nào để chỉnh sửa từ ngữ, thay đổi tên người nói (ví dụ đổi "Người nói 1" thành tên cụ thể), hoặc chuyển sang chế độ văn bản liên tục để biên tập.',
    },
    {
      question: 'Tệp âm thanh của tôi có bị lưu trữ lại trên hệ thống không?',
      answer:
        'Không. VoiceText AI tôn trọng quyền riêng tư của người dùng. Tệp âm thanh chỉ được gửi qua kết nối bảo mật để mô hình AI xử lý trong phiên làm việc hiện tại và không được lưu giữ vĩnh viễn trên máy chủ. Bạn có thể xóa bản phiên âm bất kỳ lúc nào.',
    },
    {
      question: 'Có giới hạn dung lượng tệp tải lên không?',
      answer:
        'Hệ thống hỗ trợ dung lượng tối đa lên đến 500MB cho mỗi tệp tải lên nhờ cơ chế truyền tải phân đoạn (Chunked Upload) an toàn và công nghệ trích xuất âm thanh tự động cho tệp video. Mức dung lượng này cho phép bạn thoải mái tải lên các video cuộc họp, bài giảng chuyên sâu hoặc các tệp âm thanh dài nhiều giờ liền.',
    },
    {
      question: 'Nếu phiên âm thất bại thì tôi phải làm gì?',
      answer:
        'Nếu gặp lỗi, bạn hãy kiểm tra: (1) Đảm bảo tệp âm thanh có tiếng người nói rõ ràng, không bị méo tiếng hoặc tạp âm quá lớn; (2) Dung lượng tệp không vượt quá 500MB; (3) Kiểm tra kết nối Internet; (4) Nếu bạn tự chạy hệ thống, hãy kiểm tra biến môi trường GEMINI_API_KEY trên máy chủ đã được thiết lập chính xác hay chưa.',
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 sm:py-20 bg-slate-50/50 border-t border-slate-200/80 scroll-mt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-14">
          <span className="text-xs uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Giải đáp thắc mắc
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-4 tracking-tight">
            Câu hỏi thường gặp (FAQ)
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Mọi thông tin chi tiết về tính năng, giới hạn dung lượng và cách sử dụng nền tảng VoiceText AI.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                >
                  <span className="text-sm sm:text-base">{faq.question}</span>
                  <span className="p-1 rounded-lg bg-slate-50 text-slate-400 shrink-0">
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3 animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
