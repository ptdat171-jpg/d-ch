import React from 'react';
import { Check, Sparkles, HelpCircle } from 'lucide-react';

interface PricingSectionProps {
  onSelectPlan: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  const plans = [
    {
      name: 'Gói Trải nghiệm',
      price: '0đ',
      period: 'mãi mãi',
      description: 'Phù hợp cho cá nhân, sinh viên cần phiên âm các đoạn ghi âm bài giảng hoặc cuộc họp ngắn.',
      features: [
        'Hỗ trợ tệp âm thanh và video tối đa 500MB',
        'Tải lên MP3, WAV, M4A, FLAC, MP4',
        'Ghi âm trực tiếp qua microphone',
        'Tự động phân tách người nói và dấu câu',
        'Xuất định dạng TXT, Word và SRT',
        'Không yêu cầu thẻ tín dụng',
      ],
      cta: 'Bắt đầu ngay miễn phí',
      highlight: false,
    },
    {
      name: 'Gói Chuyên nghiệp (Pro)',
      price: '149.000đ',
      period: 'mỗi tháng',
      description: 'Dành cho chuyên viên văn phòng, phóng viên, podcast creator và đội ngũ cần xử lý lượng lớn dữ liệu.',
      features: [
        'Tất cả tính năng của gói Trải nghiệm',
        'Hàng đợi ưu tiên xử lý tốc độ cao',
        'Không giới hạn số lượt chuyển đổi hàng ngày',
        'Tóm tắt AI chuyên sâu cho cuộc họp dài',
        'Xuất phụ đề WebVTT & phân tích từ khóa',
        'Hỗ trợ kỹ thuật ưu tiên 24/7',
      ],
      cta: 'Nâng cấp gói Pro',
      highlight: true,
    },
  ];

  return (
    <section id="pricing" className="py-16 sm:py-20 bg-white border-t border-slate-200/80 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-16">
          <span className="text-xs uppercase font-bold tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            Minh bạch & Đơn giản
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 mt-3 mb-4 tracking-tight">
            Bảng giá sử dụng linh hoạt
          </h2>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            Bắt đầu hoàn toàn miễn phí ngay trên trình duyệt mà không cần cung cấp thông tin thẻ thanh toán.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-7 sm:p-8 flex flex-col justify-between transition-all ${
                plan.highlight
                  ? 'bg-gradient-to-b from-indigo-50/50 to-white border-2 border-indigo-600 shadow-xl shadow-indigo-600/10 relative'
                  : 'bg-white border border-slate-200/90 shadow-sm'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3.5 right-6 bg-indigo-600 text-white text-[11px] font-bold uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3 h-3" />
                  <span>Phổ biến nhất</span>
                </div>
              )}

              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-5 leading-relaxed">
                  {plan.description}
                </p>

                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">
                    {plan.price}
                  </span>
                  <span className="text-xs sm:text-sm text-slate-500">/ {plan.period}</span>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Tính năng bao gồm:
                  </div>
                  {plan.features.map((feat) => (
                    <div key={feat} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={onSelectPlan}
                className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm transition-all ${
                  plan.highlight
                    ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-md shadow-indigo-600/25'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
