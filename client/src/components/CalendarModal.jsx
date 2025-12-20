import React from 'react';
import WeekCalendar from './WeekCalendar';

const CalendarModal = ({ open, onClose, roomId, onSelect }) => {
  if (!open) return null;
  const handleSelect = ({ start, end }) => {
    onSelect?.({ start, end });
    onClose?.();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative w-[1100px] max-w-full bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-medium text-gray-100">Chọn khung giờ</div>
          <button className="text-sm text-gray-300" onClick={onClose}>Đóng</button>
        </div>
        <WeekCalendar roomId={roomId} onSelectRange={handleSelect} />
      </div>
    </div>
  );
};

export default CalendarModal;