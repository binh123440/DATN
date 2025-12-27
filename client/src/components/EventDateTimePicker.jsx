import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import CalendarModal from './CalendarModal';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';

const EventDateTimePicker = ({ start, end, onChange, onApply, onCancel, minDate, roomId }) => {
  const [localStart, setLocalStart] = useState(start || null);
  const [localEnd, setLocalEnd] = useState(end || null);
  const [allDay, setAllDay] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);

  const normalizeDate = (d) => {
    if (!d) return null;
    const dd = d instanceof Date ? d : new Date(d);
    return Number.isNaN(dd.getTime()) ? null : dd;
  };

  // ✅ nếu có roomId thì yêu cầu chọn bằng lịch để tránh “cấn giờ” mà không cảnh báo
  const requireCalendarForRoom = !!roomId;

  useEffect(() => {
    const s = normalizeDate(start);
    const sTime = s ? s.getTime() : null;
    const localTime = localStart ? localStart.getTime() : null;
    if (sTime !== localTime) setLocalStart(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start]);

  useEffect(() => {
    const e = normalizeDate(end);
    const eTime = e ? e.getTime() : null;
    const localTime = localEnd ? localEnd.getTime() : null;
    if (eTime !== localTime) setLocalEnd(e);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end]);

  useEffect(() => {
    if (!localStart || !localEnd) return;
    if (localEnd > localStart) return;

    const correctedEnd = new Date(localStart.getTime() + 60 * 60 * 1000);
    if (correctedEnd.getTime() === localEnd.getTime()) return;

    setLocalEnd(correctedEnd);
    onChange?.({ start: localStart, end: correctedEnd, allDay });
  }, [localStart, localEnd, allDay, onChange]);

  const handleStartChange = (d) => {
    const nextStart = normalizeDate(d);
    setLocalStart(nextStart);

    let nextEnd = localEnd;
    if (nextStart) {
      if (!nextEnd || nextEnd <= nextStart) {
        nextEnd = new Date(nextStart.getTime() + 60 * 60 * 1000);
        setLocalEnd(nextEnd);
      }
    }

    onChange?.({ start: nextStart, end: nextEnd, allDay });
  };

  const handleEndChange = (d) => {
    const nextEndRaw = normalizeDate(d);
    let nextEnd = nextEndRaw;
    if (localStart && nextEnd && nextEnd <= localStart) {
      nextEnd = new Date(localStart.getTime() + 60 * 60 * 1000);
    }
    setLocalEnd(nextEnd);
    onChange?.({ start: localStart, end: nextEnd, allDay });
  };

  const handleCalendarSelect = ({ start: s, end: e }) => {
    setLocalStart(s);
    setLocalEnd(e);
    setAllDay(false);
    onChange?.({ start: s, end: e, allDay: false });
  };

  const formatShort = (d) =>
    d ? d.toLocaleString('vi-VN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Chưa chọn';

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-full">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <CalendarIcon className="text-gray-500" size={18} />
            <div>
              <div className="text-sm font-medium text-gray-700">Chọn thời gian</div>
              <div className="text-xs text-gray-400">{formatShort(localStart)} → {formatShort(localEnd)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpenCalendar(true)}
              disabled={!roomId}
              className={`px-3 py-1 rounded text-sm flex items-center gap-2 ${
                roomId ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              title={roomId ? 'Mở lịch để kiểm tra trùng giờ' : 'Vui lòng chọn phòng trước'}
            >
              <CalendarIcon size={14} /> Mở lịch
            </button>
          </div>
        </div>

        {requireCalendarForRoom && (
          <div className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
            Để tránh trùng lịch phòng, vui lòng chọn khung giờ bằng <b>Mở lịch</b>. Nhập tay sẽ bị khóa khi đã chọn phòng.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">Bắt đầu</div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-50 rounded border border-gray-200">
                <Clock size={16} className="text-gray-500" />
              </div>
              <DatePicker
                selected={localStart}
                onChange={handleStartChange}
                showTimeSelect={!allDay}
                timeIntervals={15}
                timeFormat="HH:mm"
                dateFormat={allDay ? 'dd/MM/yyyy' : 'dd/MM/yyyy HH:mm'}
                minDate={minDate}
                placeholderText="Chọn ngày bắt đầu"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                selectsStart
                startDate={localStart}
                endDate={localEnd}
                disabled={requireCalendarForRoom}
              />
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Kết thúc</div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-50 rounded border border-gray-200">
                <Clock size={16} className="text-gray-500" />
              </div>
              <DatePicker
                selected={localEnd}
                onChange={handleEndChange}
                showTimeSelect={!allDay}
                timeIntervals={15}
                timeFormat="HH:mm"
                dateFormat={allDay ? 'dd/MM/yyyy' : 'dd/MM/yyyy HH:mm'}
                minDate={localStart || minDate}
                placeholderText="Chọn ngày kết thúc"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                selectsEnd
                startDate={localStart}
                endDate={localEnd}
                disabled={requireCalendarForRoom}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-4">
          <div className="text-xs text-gray-500">
            Lưu ý: hệ thống sẽ kiểm tra trùng giờ trên phòng khi chọn bằng lịch.
          </div>
        </div>
      </div>

      <CalendarModal
        open={openCalendar}
        onClose={() => setOpenCalendar(false)}
        roomId={roomId}
        onSelect={handleCalendarSelect}
      />
    </>
  );
};

export default EventDateTimePicker;