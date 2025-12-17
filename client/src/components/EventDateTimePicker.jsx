import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

/**
 * Props:
 * - start: Date | null
 * - end: Date | null
 * - onChange: ({ start, end, allDay }) => void
 * - minDate: Date
 */
const presetDurations = [
  { label: '30 phút', minutes: 30 },
  { label: '1 giờ', minutes: 60 },
  { label: '2 giờ', minutes: 120 }
];

const EventDateTimePicker = ({ start, end, onChange, minDate }) => {
  const [localStart, setLocalStart] = useState(start || null);
  const [localEnd, setLocalEnd] = useState(end || null);
  const [allDay, setAllDay] = useState(false);

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

  const handleAllDayToggle = () => {
    setAllDay(!allDay);
    if (!allDay && localStart) {
      // strip times for all-day: set to midnight local
      const s = new Date(localStart);
      s.setHours(0,0,0,0);
      setLocalStart(s);
      if (localEnd) {
        const e = new Date(localEnd);
        e.setHours(23,59,59,999);
        setLocalEnd(e);
      } else {
        const e = new Date(s.getTime() + 24*60*60*1000 - 1);
        setLocalEnd(e);
      }
    } else if (allDay && localStart) {
      // turning off allDay: ensure sensible times
      const s = new Date(localStart);
      s.setHours(9,0,0,0);
      setLocalStart(s);
      const e = new Date(s.getTime() + 60*60*1000);
      setLocalEnd(e);
    }
  };

  const handleStartChange = (d) => {
    setLocalStart(d);
    if (!localEnd || d >= localEnd) {
      // default 1 hour length
      setLocalEnd(new Date(d.getTime() + 60 * 60 * 1000));
    }
  };

  const handleEndChange = (d) => setLocalEnd(d);

  const handleQuickNow = () => {
    const s = new Date();
    s.setMinutes(Math.ceil(s.getMinutes() / 15) * 15, 0, 0);
    const e = new Date(s.getTime() + 60 * 60 * 1000);
    setLocalStart(s);
    setLocalEnd(e);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 max-w-full">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-gray-700">Chọn thời gian</div>
        <div className="flex items-center gap-3 text-xs">
          <button type="button" onClick={handleQuickNow}
            className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">Bây giờ +1h</button>
          {presetDurations.map(p => (
            <button key={p.label} type="button" onClick={() => applyPreset(p.minutes)}
              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200">{p.label}</button>
          ))}
          <label className="ml-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allDay} onChange={handleAllDayToggle} />
            <span>Suốt ngày</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-gray-500 mb-1">Bắt đầu</div>
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

        <div>
          <div className="text-xs text-gray-500 mb-1">Kết thúc</div>
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

      <div className="text-xs text-gray-500 mt-2">
        Lưu ý: hệ thống sẽ kiểm tra trùng giờ trên phòng sau khi bạn chọn phòng và thời gian.
      </div>
    </div>
  );
};

export default EventDateTimePicker;