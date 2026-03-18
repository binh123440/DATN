import React, { useState } from 'react';
import WeekCalendar from './WeekCalendar';

const CalendarModal = ({ open, onClose, roomId, onSelect, onSelecting: parentOnSelecting }) => {
  if (!open) return null;

  const [currentSelection, setCurrentSelection] = useState(null); // { start: Date, end: Date, dayIndex, isValid }
  const [clearKey, setClearKey] = useState(0); // used to request WeekCalendar to clear persistent selection

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

      <div className="relative w-[1100px] max-w-full bg-white border border-blue-200 rounded-xl shadow-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold text-gray-900">Chọn khung giờ</div>
          <button className="text-sm text-gray-500 hover:text-gray-700" onClick={onClose}>
            Đóng
          </button>
        </div>

        {currentSelection && (
          <div className="mb-3 text-sm text-gray-800 flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div>
              Chọn: <strong>{currentSelection.start.toLocaleString('vi-VN')}</strong> →{' '}
              <strong>{currentSelection.end.toLocaleString('vi-VN')}</strong>
              {currentSelection.isValid === false && (
                <div className="mt-1 text-xs text-red-600">
                  Khung giờ này trùng với lịch đã có. Vui lòng chọn khung giờ khác.
                </div>
              )}
            </div>

            <div className="ml-auto flex gap-2">
              <button
                onClick={handleApply}
                disabled={currentSelection.isValid === false}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Áp dụng
              </button>
              <button
                onClick={() => {
                  setCurrentSelection(null);
                  setClearKey((k) => k + 1);
                }}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm border border-gray-200"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        )}

        <WeekCalendar
          roomId={roomId}
          onSelectRange={handleSelect}
          onSelecting={handleSelecting}
          clearKey={clearKey}
        />
      </div>
    </div>
  );
};

export default CalendarModal;