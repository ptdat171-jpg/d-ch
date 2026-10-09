import React from 'react';
import { Mic, Mail, Heart, Shield, FileText, ExternalLink } from 'lucide-react';

interface FooterProps {
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onSelectTool: (tab: 'upload' | 'record' | 'url') => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenPrivacy,
  onOpenTerms,
  onSelectTool,
}) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Col 1: Brand & Bio */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Mic className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">
                VoiceText <span className="text-indigo-400">AI</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Biến mọi lời nói thành văn bản trong vài phút. Nền tảng phiên âm giọng nói và video đa ngôn ngữ với độ chuẩn xác cao, tối ưu hóa cho Tiếng Việt.
            </p>
            <div className="pt-2 text-xs text-slate-500">
              Phát triển bởi đội ngũ công nghệ vì cộng đồng người học và làm việc sáng tạo.
            </div>
          </div>

          {/* Col 2: Công cụ */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Công cụ chuyển đổi
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool('upload')}
                  className="hover:text-white transition-colors"
                >
                  Chuyển Audio thành văn bản
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool('upload')}
                  className="hover:text-white transition-colors"
                >
                  Chuyển Video thành văn bản
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool('record')}
                  className="hover:text-white transition-colors"
                >
                  Ghi âm trực tiếp qua Microphone
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectTool('url')}
                  className="hover:text-white transition-colors"
                >
                  Phiên âm từ đường dẫn Media URL
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Tài nguyên & Hướng dẫn */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Hướng dẫn & Tiện ích
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  Quy trình 3 bước sử dụng
                </a>
              </li>
              <li>
                <a href="#benefits" className="hover:text-white transition-colors">
                  Lợi ích cho văn phòng & học tập
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Bảng giá dịch vụ
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  Câu hỏi thường gặp (FAQ)
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Pháp lý & Liên hệ */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Pháp lý & Hỗ trợ
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Chính sách quyền riêng tư</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenTerms}
                  className="hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Điều khoản dịch vụ</span>
                </button>
              </li>
              <li className="pt-2">
                <a
                  href="mailto:support@voicetext.ai"
                  className="hover:text-white flex items-center gap-1.5 transition-colors text-indigo-300"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>support@voicetext.ai</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 VoiceText AI. Bảo lưu mọi quyền.</p>
          <div className="flex items-center gap-4">
            <button type="button" onClick={onOpenPrivacy} className="hover:text-slate-300">
              Bảo mật
            </button>
            <span>•</span>
            <button type="button" onClick={onOpenTerms} className="hover:text-slate-300">
              Điều khoản
            </button>
            <span>•</span>
            <span>Hỗ trợ đa ngôn ngữ</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
