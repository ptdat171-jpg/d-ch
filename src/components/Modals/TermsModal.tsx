import React from 'react';
import { X, FileText, CheckCircle2 } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 border border-slate-200 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Điều khoản Dịch vụ (Terms of Service)
            </h3>
            <p className="text-xs text-slate-500">
              Có hiệu lực từ tháng 10/2026
            </p>
          </div>
        </div>

        <div className="text-sm text-slate-600 space-y-4 leading-relaxed">
          <section>
            <h4 className="font-bold text-slate-800 text-base mb-1">
              1. Chấp thuận điều khoản
            </h4>
            <p>
              Khi truy cập và sử dụng dịch vụ của VoiceText AI, bạn đồng ý tuân thủ các quy định tại điều khoản này cùng chính sách quyền riêng tư của chúng tôi.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-slate-800 text-base mb-1">
              2. Quyền sở hữu nội dung
            </h4>
            <p>
              Bạn giữ toàn bộ quyền sở hữu trí tuệ đối với các tệp âm thanh và văn bản phiên âm mà bạn tạo ra trên nền tảng. VoiceText AI không yêu cầu bất kỳ quyền sở hữu nào đối với nội dung của bạn.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-slate-800 text-base mb-1">
              3. Giới hạn trách nhiệm về độ chính xác
            </h4>
            <p>
              Mô hình trí tuệ nhân tạo nỗ lực phiên âm với độ chính xác cao nhất. Tuy nhiên, độ chuẩn xác có thể bị ảnh hưởng bởi chất lượng micro, tiếng ồn xung quanh hoặc tốc độ nói. Người dùng được khuyến khích sử dụng trình biên tập tích hợp để rà soát lại trước khi sử dụng cho các mục đích pháp lý hoặc học thuật quan trọng.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-slate-800 text-base mb-1">
              4. Hành vi nghiêm cấm
            </h4>
            <p>
              Nghiêm cấm tải lên các nội dung vi phạm pháp luật, xâm phạm bản quyền của người khác mà không có sự đồng ý, hoặc cố ý tấn công làm gián đoạn hạ tầng máy chủ của hệ thống.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Đồng ý và đóng
          </button>
        </div>
      </div>
    </div>
  );
};
