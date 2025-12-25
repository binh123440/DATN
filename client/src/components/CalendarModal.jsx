import React, { useState } from 'react';
import WeekCalendar from './WeekCalendar';

const CalendarModal = ({ open, onClose, roomId, onSelect, onSelecting: parentOnSelecting }) => {
  if (!open) return null;

  const [currentSelection, setCurrentSelection] = useState(null); // { start: Date, end: Date, dayIndex }
  const [clearKey, setClearKey] = useState(0); // used to request WeekCalendar to clear persistent selection

  // Khi WeekCalendar gọi (kéo-thả xong) -> chỉ emit dữ liệu, KHÔNG đóng modal.
  // Nếu muốn vừa chọn vừa đóng (khi bấm nút "Áp dụng"), truyền close=true.
  const handleSelect = ({ start, end }, close = false) => {
    onSelect?.({ start, end });
    setCurrentSelection(null);
    if (close) onClose?.();
  };

  const handleSelecting = (sel) => {
    setCurrentSelection(sel || null);
    if (typeof parentOnSelecting === 'function') parentOnSelecting(sel || null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative w-[1100px] max-w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-medium text-gray-100">Chọn khung giờ</div>
          <button className="text-sm text-gray-300" onClick={onClose}>Đóng</button>
        </div>

        {/* Hiển thị chọn tạm thời khi kéo */}
        {currentSelection && (
          <div className="mb-3 text-sm text-gray-200 flex items-center gap-4">
            <div>Chọn: <strong>{currentSelection.start.toLocaleString('vi-VN')}</strong> → <strong>{currentSelection.end.toLocaleString('vi-VN')}</strong></div>
            <div className="ml-auto flex gap-2">
              <button onClick={() => handleSelect({ start: currentSelection.start, end: currentSelection.end }, true)} className="px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-500 text-sm">Áp dụng</button>
              <button onClick={() => { setCurrentSelection(null); setClearKey(k => k + 1); }} className="px-3 py-1 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 text-sm">Bỏ chọn</button>
            </div>
          </div>
        )}

        <WeekCalendar roomId={roomId} onSelectRange={handleSelect} onSelecting={handleSelecting} clearKey={clearKey} />
      </div>
    </div>
  );
};

export default CalendarModal;