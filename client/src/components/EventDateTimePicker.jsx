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

  // sync incoming props -> local state
  useEffect(() => { setLocalStart(start || null); }, [start]);
  useEffect(() => { setLocalEnd(end || null); }, [end]);

  // ensure end >= start
  useEffect(() => {
    if (localStart && localEnd && localEnd <= localStart) {
      // if end not valid, bump end to start + 1 hour
      const n = new Date(localStart.getTime() + 60 * 60 * 1000);
      setLocalEnd(n);
    }
    // notify parent
    onChange?.({ start: localStart, end: localEnd, allDay });
  }, [localStart, localEnd, allDay]); // eslint-disable-line

  const applyPreset = (minutes) => {
    if (!localStart) {
      const s = new Date();
      const e = new Date(s.getTime() + minutes * 60 * 1000);
      setLocalStart(s);
      setLocalEnd(e);
      return;
    }
    setLocalEnd(new Date(localStart.getTime() + minutes * 60 * 1000));
  };

  // keep allDay state for API contract, but hide the toggle UI per UX request

  const handleStartChange = (d) => {
    setLocalStart(d);
    if (!localEnd || d >= localEnd) {
      // default 1 hour length
      setLocalEnd(new Date(d.getTime() + 60 * 60 * 1000));
    }
  };

  const handleEndChange = (d) => setLocalEnd(d);

  // when user applies in "calendar modal" -> set local and notify parent
  const handleCalendarSelect = ({ start: s, end: e }) => {
    setLocalStart(s);
    setLocalEnd(e);
    setAllDay(false);
    onChange?.({ start: s, end: e, allDay: false });
  };

  const formatShort = (d) => d ? d.toLocaleString('vi-VN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Chưa chọn';

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
            <button onClick={() => setOpenCalendar(true)} className="px-3 py-1 rounded bg-gray-100 text-sm hover:bg-gray-200 flex items-center gap-2">
              <CalendarIcon size={14} /> Mở lịch
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">Bắt đầu</div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-50 rounded border border-gray-200"><Clock size={16} className="text-gray-500" /></div>
              <DatePicker
                selected={localStart}
                onChange={handleStartChange}
                showTimeSelect={!allDay}
                timeIntervals={15}
                timeFormat="HH:mm"
                dateFormat={allDay ? "dd/MM/yyyy" : "dd/MM/yyyy HH:mm"}
                minDate={minDate}
                placeholderText="Chọn ngày bắt đầu"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                selectsStart
                startDate={localStart}
                endDate={localEnd}
              />
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-1">Kết thúc</div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-50 rounded border border-gray-200"><Clock size={16} className="text-gray-500" /></div>
              <DatePicker
                selected={localEnd}
                onChange={handleEndChange}
                showTimeSelect={!allDay}
                timeIntervals={15}
                timeFormat="HH:mm"
                dateFormat={allDay ? "dd/MM/yyyy" : "dd/MM/yyyy HH:mm"}
                minDate={localStart || minDate}
                placeholderText="Chọn ngày kết thúc"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                selectsEnd
                startDate={localStart}
                endDate={localEnd}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-4">
          <div className="text-xs text-gray-500">Lưu ý: hệ thống sẽ kiểm tra trùng giờ trên phòng sau khi chọn.</div>
        </div>
      </div>

      <CalendarModal open={openCalendar} onClose={() => setOpenCalendar(false)} roomId={roomId} onSelect={handleCalendarSelect} />
    </>
  );
};

export default EventDateTimePicker;