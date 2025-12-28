import React, { useMemo, useState } from 'react';
import { Calendar, FileText, ExternalLink } from 'lucide-react';
import ImageGalleryModal from './ImageGalleryModal';

const getInitials = (name = 'U') =>
  String(name)
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const parseDateAny = (v) => {
  if (!v) return null;
  const s = typeof v === 'string' ? v.replace(' ', 'T') : v; // hỗ trợ "YYYY-MM-DD HH:mm:ss"
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
};

const formatDateTimeVi = (v) => {
  const d = parseDateAny(v);
  return d ? d.toLocaleString('vi-VN') : '';
};

const SharedPostPreview = ({ originalPost, onOpenModal, isInModal = false }) => {
  const goc = originalPost;
  if (!goc) return null;

  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const isEvent = !!(goc.su_kien && typeof goc.su_kien === 'object' && goc.su_kien.id);
  const authorName = goc.tac_gia?.ho_ten || 'Ẩn danh';
  const createdAt = goc.ngay_tao || goc.su_kien?.thoi_gian_bat_dau;

  const text = useMemo(() => goc.noi_dung || goc.su_kien?.mo_ta || '', [goc]);
  const media = useMemo(() => (Array.isArray(goc.media_urls) ? goc.media_urls : []), [goc]);

  const displayMedia = media.slice(0, 2);
  const remaining = Math.max(0, media.length - displayMedia.length);

  // ✅ Card click chỉ khi KHÔNG ở modal
  const canOpenCard = !isInModal && typeof onOpenModal === 'function' && goc.id;

  // ✅ Nút "Xem bài gốc" vẫn hiện trong modal nếu có onOpenModal
  const canOpenButton = typeof onOpenModal === 'function' && goc.id;

  const handleOpenOriginal = () => {
    if (canOpenButton) onOpenModal(goc.id);
  };

  const handleMediaClick = (index, e) => {
    e.stopPropagation();
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  return (
    <>
      <div
        className={[
          'mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm',
          canOpenCard ? 'cursor-pointer hover:bg-gray-100 hover:shadow-md transition-all' : ''
        ].join(' ')}
        onClick={canOpenCard ? handleOpenOriginal : undefined}
        role={canOpenCard ? 'button' : undefined}
        tabIndex={canOpenCard ? 0 : undefined}
        onKeyDown={(e) => {
          if (!canOpenCard) return;
          if (e.key === 'Enter' || e.key === ' ') handleOpenOriginal();
        }}
      >
        {/* nhãn nhỏ "Bài gốc" để user hiểu rõ */}
        <div className="mb-2">
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-gray-600 bg-white border border-gray-200 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            Bài gốc
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shrink-0">
              {getInitials(authorName)}
            </div>

            <div className="min-w-0">
              <div className="font-semibold text-gray-900 truncate">{authorName}</div>
              <div className="text-xs text-gray-500">{formatDateTimeVi(createdAt)}</div>
            </div>
          </div>

          <span
            className={[
              'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border shrink-0',
              isEvent ? 'bg-cyan-50 text-cyan-700 border-cyan-100' : 'bg-blue-50 text-blue-700 border-blue-100'
            ].join(' ')}
          >
            {isEvent ? <Calendar size={14} /> : <FileText size={14} />}
            {isEvent ? 'Sự kiện' : 'Bài viết'}
          </span>
        </div>

        {isEvent && (
          <div className="mb-3 rounded-lg border border-cyan-100 bg-cyan-50/60 p-3">
            <div className="font-semibold text-cyan-900">{goc.su_kien?.ten_su_kien}</div>
            <div className="text-xs text-cyan-800 mt-1">
              {goc.su_kien?.dia_diem ? `📍 ${goc.su_kien.dia_diem}` : ''}
              {goc.su_kien?.thoi_gian_bat_dau ? ` • ⏰ ${formatDateTimeVi(goc.su_kien.thoi_gian_bat_dau)}` : ''}
            </div>
          </div>
        )}

        {text && (
          <div className="text-sm text-gray-800 leading-relaxed line-clamp-3 whitespace-pre-wrap">
            {text}
          </div>
        )}

        {displayMedia.length > 0 && (
          <div className={`mt-3 grid gap-2 ${displayMedia.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {displayMedia.map((m, idx) => {
              const url = m?.url;
              const type = m?.resource_type;
              if (!url) return null;

              return (
                <div
                  key={idx}
                  className="relative overflow-hidden rounded-lg border border-gray-200 bg-white cursor-pointer group"
                  onClick={(e) => handleMediaClick(idx, e)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleMediaClick(idx, e);
                  }}
                >
                  {type === 'video' ? (
                    <video
                      src={url}
                      className="w-full h-44 object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <img
                      src={url}
                      alt=""
                      className="w-full h-44 object-cover transition-transform duration-200 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}

                  {idx === 1 && remaining > 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-2xl font-bold">+{remaining}</span>
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
              );
            })}
          </div>
        )}

        {/* ✅ Nút luôn có trong modal */}
        {canOpenButton && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenOriginal();
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
              title="Xem bài gốc"
            >
              <ExternalLink size={14} />
              Xem bài gốc
            </button>
          </div>
        )}
      </div>

      {showImageModal && media.length > 0 && (
        <ImageGalleryModal
          media={media}
          initialIndex={selectedImageIndex}
          onClose={() => setShowImageModal(false)}
        />
      )}
    </>
  );
};

export default SharedPostPreview;