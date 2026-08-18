import React, { useState } from 'react';
import {
  X,
  Heart,
  Coffee,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface SponsorAuthorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

// 微信赞赏码与支付宝赞赏码文件路径尝试列表（优先匹配 public/wechat-qr.png 与 public/alipay-qr.png）
const WECHAT_QR_PATHS = ['/wechat-qr.png', '/wechat_qr.png', '/wechat-qr.jpg', '/wechat_qr.jpg', '/wechat.png'];
const ALIPAY_QR_PATHS = ['/alipay-qr.png', '/alipay_qr.png', '/alipay-qr.jpg', '/alipay_qr.jpg', '/alipay.png'];

export const SponsorAuthorModal: React.FC<SponsorAuthorModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [selectedAmount, setSelectedAmount] = useState<number>(5);
  const [copiedNote, setCopiedNote] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [wechatImgIndex, setWechatImgIndex] = useState(0);
  const [alipayImgIndex, setAlipayImgIndex] = useState(0);

  if (!isOpen) return null;

  const amounts = [2, 5, 10, 20, 50];

  const handleCopyNote = () => {
    navigator.clipboard.writeText('感谢对 FloveNote 的支持！笔记软件持续更新中 ❤️');
    setCopiedNote(true);
    onShowToast('赞赏寄语已复制到剪贴板！', 'success');
    setTimeout(() => setCopiedNote(false), 2000);
  };

  const handleConfirmPaid = () => {
    setHasPaid(true);
    onShowToast('非常感谢您的慷慨赞赏！有了您的支持，FloveNote 会越来越好 ❤️', 'success');
  };

  const currentQrPath =
    payMethod === 'wechat'
      ? WECHAT_QR_PATHS[wechatImgIndex]
      : ALIPAY_QR_PATHS[alipayImgIndex];

  const isImgLoadError =
    payMethod === 'wechat'
      ? wechatImgIndex >= WECHAT_QR_PATHS.length
      : alipayImgIndex >= ALIPAY_QR_PATHS.length;

  const handleImgError = () => {
    if (payMethod === 'wechat') {
      setWechatImgIndex((prev) => prev + 1);
    } else {
      setAlipayImgIndex((prev) => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-gradient-to-r from-rose-50/80 via-indigo-50/50 to-white dark:from-rose-950/30 dark:via-indigo-950/20 dark:to-zinc-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-500 text-white shadow-md shadow-rose-500/20">
              <Heart className="w-5 h-5 fill-current animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-zinc-100 text-base flex items-center gap-1.5">
                <span>赞赏与支持作者</span>
                <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-1.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/40">
                  感谢有你
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">支持 FloveNote 独立开发与持续更新</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-200/60 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Thank you card */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 space-y-1">
            <p className="font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 text-xs">
              <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>请作者喝杯咖啡 ☕</span>
            </p>
            <p className="text-amber-700/90 dark:text-amber-300/80 text-[11px] leading-relaxed">
              FloveNote 是一款专注于极简与所见即所得体验的笔记软件。如果它对您的日常学习、写作和记录有所帮助，欢迎赞赏一份支持！
            </p>
          </div>

          {/* Payment Method Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-zinc-800/80 rounded-2xl font-semibold">
            <button
              type="button"
              onClick={() => {
                setPayMethod('wechat');
                setWechatImgIndex(0);
              }}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                payMethod === 'wechat'
                  ? 'bg-emerald-500 text-white shadow-sm scale-[1.01]'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.06 5.571-.15.892-.61 2.302-1.39 3.05 0 0 1.95-.23 3.32-1.09.84.23 1.74.36 2.68.36.21 0 .42-.01.63-.02-.13-.48-.2-.97-.2-1.48 0-3.82 3.82-6.92 8.53-6.92 1.28 0 2.5.23 3.59.65C19.34 5.37 14.54 2.188 8.691 2.188zm-2.8 4.21c.64 0 1.16.52 1.16 1.16 0 .64-.52 1.16-1.16 1.16-.64 0-1.16-.52-1.16-1.16 0-.64.52-1.16 1.16-1.16zm5.32 0c.64 0 1.16.52 1.16 1.16 0 .64-.52 1.16-1.16 1.16-.64 0-1.16-.52-1.16-1.16 0-.64.52-1.16 1.16-1.16zM15.93 10.3c-4.14 0-7.5 2.76-7.5 6.16 0 3.4 3.36 6.16 7.5 6.16.83 0 1.63-.11 2.38-.32 1.21.76 2.94.97 2.94.97-.69-.66-1.1-1.91-1.23-2.7 1.67-1.21 2.71-2.97 2.71-4.93 0-3.4-3.36-6.16-7.5-6.16zm-2.48 3.73c.56 0 1.02.46 1.02 1.02 0 .56-.46 1.02-1.02 1.02-.56 0-1.02-.46-1.02-1.02 0-.56.46-1.02 1.02-1.02zm4.72 0c.56 0 1.02.46 1.02 1.02 0 .56-.46 1.02-1.02 1.02-.56 0-1.02-.46-1.02-1.02 0-.56.46-1.02 1.02-1.02z" />
              </svg>
              <span>微信赞赏</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPayMethod('alipay');
                setAlipayImgIndex(0);
              }}
              className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                payMethod === 'alipay'
                  ? 'bg-blue-600 text-white shadow-sm scale-[1.01]'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900'
              }`}
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.83 14.07c-1.32-.44-3.07-.97-4.95-1.53 1.12-1.57 1.93-3.33 2.37-5.18H20V5.2h-6.22V2h-3.15v3.2H4.4v2.16h7.62c-.39 1.4-1.01 2.75-1.85 3.96-1.74-1.21-3.1-2.67-3.92-4.22H3.72c1.02 2.2 2.72 4.14 4.88 5.67C6.01 14.15 3 15.66 3 18.25 3 20.87 5.63 22 8.87 22c4.01 0 7.37-2.02 10.02-5.46 2.05 1.1 4.15 2.02 5.11 2.36v-2.88c-.96-.34-2.83-1.12-5.17-1.95zM8.87 20c-2.11 0-3.62-.71-3.62-1.82 0-.98 1.41-1.94 4.08-2.87 1.2.98 2.58 1.94 4.03 2.82C11.89 19.38 10.36 20 8.87 20z" />
              </svg>
              <span>支付宝赞赏</span>
            </button>
          </div>

          {/* Amount Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-zinc-400 mb-1.5">
              选择赞赏金额:
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {amounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setSelectedAmount(amt)}
                  className={`py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selectedAmount === amt
                      ? payMethod === 'wechat'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-slate-50 dark:bg-zinc-800/60 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-700 hover:bg-slate-100'
                  }`}
                >
                  ￥{amt}
                </button>
              ))}
            </div>
          </div>

          {/* QR Code Container */}
          <div className="relative p-4 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-zinc-800 dark:to-zinc-900 border border-slate-200/80 dark:border-zinc-700/80 flex flex-col items-center justify-center gap-3">
            <div
              className={`p-2 bg-white rounded-2xl shadow-md border-2 transition-colors relative flex items-center justify-center ${
                payMethod === 'wechat' ? 'border-emerald-500' : 'border-blue-500'
              }`}
            >
              {!isImgLoadError ? (
                <img
                  src={currentQrPath}
                  alt={`${payMethod === 'wechat' ? '微信' : '支付宝'}赞赏码`}
                  onError={handleImgError}
                  className="w-44 h-44 object-contain rounded-xl"
                />
              ) : (
                /* Vector QR code pattern fallback when image file is not yet placed in public/ */
                <div className="w-44 h-44 bg-slate-900 rounded-xl p-2.5 flex flex-col items-center justify-between relative overflow-hidden">
                  <div className="absolute inset-0 opacity-90 bg-[radial-gradient(#fff_2px,transparent_2px)] [background-size:10px_10px]" />

                  {/* 3 Position Detection Patterns (QR Corners) */}
                  <div className="w-full flex justify-between z-10">
                    <div className="w-10 h-10 border-4 border-white bg-slate-900 rounded-md p-1">
                      <div className="w-full h-full bg-white rounded-xs" />
                    </div>
                    <div className="w-10 h-10 border-4 border-white bg-slate-900 rounded-md p-1">
                      <div className="w-full h-full bg-white rounded-xs" />
                    </div>
                  </div>

                  {/* Center Brand Logo */}
                  <div
                    className={`w-10 h-10 rounded-xl z-20 shadow-lg flex items-center justify-center text-white border-2 border-white ${
                      payMethod === 'wechat' ? 'bg-emerald-500' : 'bg-blue-600'
                    }`}
                  >
                    {payMethod === 'wechat' ? (
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.06 5.571-.15.892-.61 2.302-1.39 3.05 0 0 1.95-.23 3.32-1.09.84.23 1.74.36 2.68.36.21 0 .42-.01.63-.02-.13-.48-.2-.97-.2-1.48 0-3.82 3.82-6.92 8.53-6.92 1.28 0 2.5.23 3.59.65C19.34 5.37 14.54 2.188 8.691 2.188zm-2.8 4.21c.64 0 1.16.52 1.16 1.16 0 .64-.52 1.16-1.16 1.16-.64 0-1.16-.52-1.16-1.16 0-.64.52-1.16 1.16-1.16zm5.32 0c.64 0 1.16.52 1.16 1.16 0 .64-.52 1.16-1.16 1.16-.64 0-1.16-.52-1.16-1.16 0-.64.52-1.16 1.16-1.16z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                        <path d="M18.83 14.07c-1.32-.44-3.07-.97-4.95-1.53 1.12-1.57 1.93-3.33 2.37-5.18H20V5.2h-6.22V2h-3.15v3.2H4.4v2.16h7.62c-.39 1.4-1.01 2.75-1.85 3.96-1.74-1.21-3.1-2.67-3.92-4.22H3.72c1.02 2.2 2.72 4.14 4.88 5.67C6.01 14.15 3 15.66 3 18.25 3 20.87 5.63 22 8.87 22c4.01 0 7.37-2.02 10.02-5.46 2.05 1.1 4.15 2.02 5.11 2.36v-2.88c-.96-.34-2.83-1.12-5.17-1.95z" />
                      </svg>
                    )}
                  </div>

                  {/* Bottom Left Corner Pattern */}
                  <div className="w-full flex justify-start z-10">
                    <div className="w-10 h-10 border-4 border-white bg-slate-900 rounded-md p-1">
                      <div className="w-full h-full bg-white rounded-xs" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-center space-y-1">
              <p className="font-bold text-slate-800 dark:text-zinc-100 text-sm">
                打开{payMethod === 'wechat' ? '微信' : '支付宝'}扫一扫
              </p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                支持金额：<span className="font-bold text-indigo-600 dark:text-indigo-400">￥{selectedAmount} 元</span>（或任意意向数额）
              </p>
            </div>
          </div>

          {/* Copy Message / Feedback */}
          {hasPaid ? (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/40 text-center space-y-1">
              <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>感谢您的爱心支持！</span>
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                您的鼓励是 FloveNote 持续保持高质高效更新的不竭动力！
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyNote}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedNote ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedNote ? '已复制赞赏语' : '复制赞赏寄语'}</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmPaid}
                className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>我已完成赞赏</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-zinc-900/80 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-zinc-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>无广告 · 纯粹开源笔记体验</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 font-semibold"
          >
            关闭窗口
          </button>
        </div>
      </div>
    </div>
  );
};

