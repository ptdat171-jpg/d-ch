import React from 'react';
import { X, ShieldCheck, Lock, EyeOff, Trash2 } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
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
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Chính sách Quyền riêng tư (Privacy Policy)
            </h3>
            <p className="text-xs text-slate-500">
              Cập nhật lần cuối: Tháng 10/2026
            </p>
          </div>
        </div>

        <div className="text-sm text-slate-600 space-y-4 leading-relaxed">
          <section>
            <h4 className="font-bold text-slate-800 text-base mb-1.5 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              1. Mục đích xử lý dữ liệu
            </h4>
            <p>
              VoiceText AI tiếp nhận các tệp âm thanh, video hoặc giọng nói thu từ microphone của bạn chỉ nhằm mục đích duy nhất là chuyển đổi thành văn bản theo yêu cầu của bạn. Chúng tôi không sử dụng dữ liệu âm thanh cá nhân của bạn để quảng cáo hoặc bán cho bên thứ ba.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-slate-800 text-base mb-1.5 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-indigo-600" />
              2. Chính sách lưu trữ và xóa tệp
            </h4>
            <p>
              Tệp âm thanh được tải lên được chuyển qua kết nối bảo mật đến mô hình xử lý. Khi hoàn tất phiên âm và bạn đóng phiên làm việc, dữ liệu tạm thời trên máy chủ sẽ được giải phóng. Chúng tôi không lưu trữ vĩnh viễn tệp âm thanh gốc trên cơ sở dữ liệu.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-slate-800 text-base mb-1.5 flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-indigo-600" />
              3. Quyền của người dùng
            </h4>
            <p>
              Bạn có toàn quyền kiểm soát văn bản kết quả: chỉnh sửa nội dung, xóa bỏ văn bản trên màn hình làm việc, hoặc tải xuống các định dạng tệp lưu trữ riêng trên thiết bị cá nhân của bạn.
            </p>
          </section>

          <section>
            <h4 className="font-bold text-slate-800 text-base mb-1.5">
              4. Bảo mật truyền tải
            </h4>
            <p>
              Mọi lưu lượng dữ liệu giữa trình duyệt của bạn và máy chủ dịch vụ đều được bảo vệ bằng giao thức mã hóa HTTPS/TLS tiêu chuẩn.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Tôi đã hiểu
          </button>
        </div>
      </div>
    </div>
  );
};
