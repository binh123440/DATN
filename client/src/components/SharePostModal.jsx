import React from 'react';
import { Copy, Link as LinkIcon } from 'lucide-react';

const SharePostModal = ({ open, onClose, value, onChange, onSubmit, isSubmitting, shareLink, onCopyLink }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/40" onClick={onClose} aria-label="Đóng" />

      <div className="relative mx-auto mt-24 w-[92%] max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-900">Chia sẻ bài viết</div>
          <button type="button" onClick={onClose} className="px-2 py-1 rounded-lg text-gray-600 hover:bg-gray-100">
            Đóng
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* ✅ Copy link để dán vào chat -> hiện preview */}
          {shareLink && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-gray-700 inline-flex items-center gap-2">
                  <LinkIcon size={14} className="text-gray-500" />
                  Liên kết chia sẻ (dán vào tin nhắn để hiện preview)
                </div>

                <button
                  type="button"
                  onClick={onCopyLink}
                  className="inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                >
                  <Copy size={14} />
                  Sao chép
                </button>
              </div>

              <input
                value={shareLink}
                readOnly
                className="w-full text-xs bg-white border border-gray-200 rounded-lg px-3 py-2 font-mono text-gray-700"
                onFocus={(e) => e.target.select()}
              />
              <div className="mt-2 text-[11px] text-gray-500">
                Mẹo: bạn có thể thêm ghi chú trước token, ví dụ: “Xem cái này nè” rồi dán link bên dưới.
              </div>
            </div>
          )}

          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            rows={3}
            placeholder="Bạn muốn viết gì khi chia sẻ?"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Đang chia sẻ...' : 'Chia sẻ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePostModal;