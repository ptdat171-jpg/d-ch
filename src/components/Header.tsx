import React, { useState } from 'react';
import { Mic, Menu, X, Sparkles, LogIn, ChevronRight, Check } from 'lucide-react';
import { ServerStatus } from '../types';

interface HeaderProps {
  serverStatus: ServerStatus | null;
  onOpenAuth: () => void;
  onScrollToConverter: () => void;
  activeSection: string;
}

export const Header: React.FC<HeaderProps> = ({
  serverStatus,
  onOpenAuth,
  onScrollToConverter,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Trang chủ', href: '#' },
    { label: 'Công cụ', href: '#tools' },
    { label: 'Hướng dẫn', href: '#how-it-works' },
    { label: 'Lợi ích', href: '#benefits' },
    { label: 'Bảng giá', href: '#pricing' },
    { label: 'FAQ', href: '#faq' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (href === '#') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <a
          href="#"
          onClick={(e) => handleNavClick(e, '#')}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
              VoiceText <span className="text-indigo-600">AI</span>
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-600">
              Biến giọng nói thành văn bản
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions & Status */}
        <div className="hidden md:flex items-center gap-3">
          {/* Status Badge */}
          {serverStatus && (
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                serverStatus.configured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={
                serverStatus.configured
                  ? `Mô hình: ${serverStatus.primaryModel}`
                  : 'Chưa cấu hình GEMINI_API_KEY trong .env'
              }
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  serverStatus.configured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>{serverStatus.configured ? 'AI Sẵn sàng' : 'Chưa có API Key'}</span>
            </div>
          )}

          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng nhập</span>
          </button>

          <button
            onClick={onScrollToConverter}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-sm shadow-indigo-600/20 hover:shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Bắt đầu miễn phí</span>
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={onScrollToConverter}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
          >
            Bắt đầu
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3 animate-in fade-in slide-in-from-top-4">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="px-3 py-2.5 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 flex items-center justify-between"
              >
                <span>{link.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            ))}
          </nav>
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAuth();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập tài khoản</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onScrollToConverter();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg"
            >
              <Sparkles className="w-4 h-4" />
              <span>Bắt đầu phiên âm ngay</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
