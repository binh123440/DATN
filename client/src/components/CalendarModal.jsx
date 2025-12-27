import React, { useState } from 'react';
import WeekCalendar from './WeekCalendar';

const CalendarModal = ({ open, onClose, roomId, onSelect, onSelecting: parentOnSelecting }) => {
  if (!open) return null;

  const [currentSelection, setCurrentSelection] = useState(null); // { start: Date, end: Date, dayIndex, isValid }
  const [clearKey, setClearKey] = useState(0); // used to request WeekCalendar to clear persistent selection

  // Khi WeekCalendar gọi (kéo-thả xong) -> chỉ ghi nhận khung giờ đã chọn để hiển thị.
  // Chỉ khi bấm "Áp dụng" mới commit (gọi onSelect) và đóng modal.
  const handleSelect = ({ start, end }) => {
    setCurrentSelection({ start, end, isValid: true });
  };

  const handleApply = () => {
    if (!currentSelection || currentSelection.isValid === false) return;
    onSelect?.({ start: currentSelection.start, end: currentSelection.end });
    setCurrentSelection(null);
    onClose?.();
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
            <div>
              Chọn: <strong>{currentSelection.start.toLocaleString('vi-VN')}</strong> → <strong>{currentSelection.end.toLocaleString('vi-VN')}</strong>
              {currentSelection.isValid === false && (
                <div className="mt-1 text-xs text-red-300">
                  Khung giờ này trùng với lịch đã có. Vui lòng chọn khung giờ khác.
                </div>
              )}
            </div>
            <div className="ml-auto flex gap-2">
              <button
                onClick={handleApply}
                disabled={currentSelection.isValid === false}
                className="px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Áp dụng
              </button>
              <button
                onClick={() => { setCurrentSelection(null); setClearKey(k => k + 1); }}
                className="px-3 py-1 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 text-sm"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        )}

        <WeekCalendar roomId={roomId} onSelectRange={handleSelect} onSelecting={handleSelecting} clearKey={clearKey} />
      </div>
    </div>
  );
};

export default CalendarModal;