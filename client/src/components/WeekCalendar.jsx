import React, { useEffect, useMemo, useRef, useState } from 'react';
import { laySuKienTheoKhoang } from '../services/apiService';

/**
 * Props:
 * - roomId?: number
 * - startOfWeek?: Date (default: monday of current week)
 * - startHour?: number (8)
 * - endHour?: number (22)
 * - slotMinutes?: number (15)
 * - onSelectRange: ({ start: Date, end: Date }) => void
 */
const WeekCalendar = ({ roomId, startOfWeek, startHour = 8, endHour = 22, slotMinutes = 15, onSelectRange }) => {
  const containerRef = useRef(null);
  const [weekStart, setWeekStart] = useState(() => {
    if (startOfWeek) return new Date(startOfWeek);
    const d = new Date();
    const day = d.getDay(); // 0 Sun .. 6 Sat
    const diff = (day + 6) % 7; // shift to Monday=0
    d.setDate(d.getDate() - diff);
    d.setHours(0,0,0,0);
    return d;
  });
  const days = useMemo(() => Array.from({ length: 7 }).map((_, i) => {
    const dd = new Date(weekStart);
    dd.setDate(dd.getDate() + i);
    return dd;
  }), [weekStart]);

  const hourCount = Math.max(1, endHour - startHour);
  const hourHeight = 48; // px per hour (tweak)
  const slotHeight = (hourHeight * slotMinutes) / 60;
  const totalHeight = hourCount * hourHeight;

  const [events, setEvents] = useState([]);
  useEffect(() => {
    let mounted = true;
    const fetchEvents = async () => {
      if (!roomId) return setEvents([]);
      const weekStartISO = new Date(weekStart);
      weekStartISO.setHours(0,0,0,0);
      const weekEnd = new Date(weekStartISO);
      weekEnd.setDate(weekEnd.getDate() + 7);
      try {
        const resp = await laySuKienTheoKhoang({ startISO: weekStartISO.toISOString(), endISO: weekEnd.toISOString(), id_phong: roomId });
        if (!mounted) return;
        setEvents((resp && resp.success) ? resp.data : []);
      } catch (err) {
        setEvents([]);
      }
    };
    fetchEvents();
    return () => { mounted = false; };
  }, [roomId, weekStart]);

  // selection state
  const [selection, setSelection] = useState(null); // { dayIndex, startMin, endMin }
  const selectingRef = useRef(false);
  const pageMouse = useRef({}); // { col, dayIndex, startMin }

  const minutesToPx = (minutes) => (minutes / 60) * hourHeight;
  const yToMinutes = (clientY, columnEl) => {
    const rect = columnEl.getBoundingClientRect();
    let y = clientY - rect.top;
    y = Math.max(0, Math.min(y, totalHeight));
    const minutesFromStart = (y / hourHeight) * 60 + startHour * 60;
    // snap to slotMinutes
    const snapped = Math.round(minutesFromStart / slotMinutes) * slotMinutes;
    return snapped;
  };

  const onMouseDownColumn = (e, dayIndex) => {
    if (e.button !== 0) return; // only left click
    const col = e.currentTarget;
    const startMin = yToMinutes(e.clientY, col);
    selectingRef.current = true;
    pageMouse.current = { col, dayIndex, startMin };
    setSelection({ dayIndex, startMin, endMin: startMin + slotMinutes }); // show minimal
    window.addEventListener('mousemove', onWindowMouseMove);
    window.addEventListener('mouseup', onWindowMouseUp);
    e.preventDefault();
  };

  const onWindowMouseMove = (e) => {
    if (!selectingRef.current) return;
    const { col, dayIndex, startMin } = pageMouse.current;
    if (!col) return;
    const endMinRaw = yToMinutes(e.clientY, col);
    let s = Math.min(startMin, endMinRaw);
    let t = Math.max(startMin, endMinRaw);
    if (t === s) t = s + slotMinutes;
    // clamp to day range
    const minAllowed = startHour * 60;
    const maxAllowed = endHour * 60;
    s = Math.max(minAllowed, Math.min(s, maxAllowed - slotMinutes));
    t = Math.max(minAllowed + slotMinutes, Math.min(t, maxAllowed));
    setSelection({ dayIndex, startMin: s, endMin: t });
  };

  const onWindowMouseUp = () => {
    if (!selectingRef.current) return;
    selectingRef.current = false;
    window.removeEventListener('mousemove', onWindowMouseMove);
    window.removeEventListener('mouseup', onWindowMouseUp);
    const sel = pageMouse.current && selection;
    if (sel && onSelectRange) {
      const day = days[sel.dayIndex];
      const start = new Date(day);
      start.setHours(0,0,0,0);
      start.setMinutes(sel.startMin, 0, 0);
      const end = new Date(day);
      end.setHours(0,0,0,0);
      end.setMinutes(sel.endMin, 0, 0);
      // ensure start < end
      if (end <= start) end.setMinutes(start.getMinutes() + slotMinutes);
      onSelectRange({ start, end });
    }
    setSelection(null);
    pageMouse.current = {};
  };

  // helper to render events inside day column
  const renderEventsForDay = (day, dayIndex) => {
    const ds = events.filter(ev => {
      const evStart = new Date(ev.thoi_gian_bat_dau);
      const evEnd = new Date(ev.thoi_gian_ket_thuc || ev.thoi_gian_bat_dau);
      // intersects day
      return (Number(ev.id_phong) === Number(roomId)) &&
        evStart < new Date(day.getTime() + 24*60*60*1000) &&
        evEnd > new Date(day.getTime());
    });
    return ds.map(ev => {
      const evStart = new Date(ev.thoi_gian_bat_dau);
      const evEnd = new Date(ev.thoi_gian_ket_thuc || ev.thoi_gian_bat_dau);
      const dayStart = new Date(day); dayStart.setHours(startHour,0,0,0);
      const topMin = Math.max(0, (evStart - dayStart) / 60000);
      const bottomMin = Math.max(0, (evEnd - dayStart) / 60000);
      const top = minutesToPx(topMin);
      const height = Math.max(slotHeight, minutesToPx(Math.max(0, bottomMin - topMin)));
      return (
        <div key={ev.id}
          className="absolute left-1 right-1 bg-emerald-500/90 text-white rounded-md px-2 py-1 text-xs cursor-pointer overflow-hidden"
          style={{ top, height, zIndex: 10 }}>
          <div className="font-medium truncate">{ev.ten_su_kien}</div>
          <div className="text-[10px] opacity-80 truncate">
            {new Date(ev.thoi_gian_bat_dau).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(ev.thoi_gian_ket_thuc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="w-full flex gap-3">
      {/* time column */}
      <div className="w-14 text-xs text-gray-500">
        <div className="h-6">&nbsp;</div>
        <div className="relative" style={{ height: totalHeight }}>
          {Array.from({ length: hourCount }).map((_, i) => (
            <div key={i} className="flex items-start" style={{ height: hourHeight, borderTop: '1px solid rgba(55,65,81,0.6)' }}>
              <div className="w-full text-right pr-2">{String(startHour + i).padStart(2,'0')}:00</div>
            </div>
          ))}
        </div>
      </div>

      {/* days columns */}
      <div className="flex-1 grid grid-cols-7 gap-2">
        {days.map((d, dayIndex) => (
          <div key={dayIndex} className="border border-gray-700 rounded bg-transparent">
            <div className="px-2 py-1 text-xs bg-gray-800 text-gray-200 border-b border-gray-700 flex items-center justify-between">
              <div>
                <div className="font-medium">{d.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                <div className="text-[11px] opacity-70">{d.getDate()}</div>
              </div>
            </div>

            <div
              ref={el => { if (dayIndex === 0 && containerRef.current == null) containerRef.current = el; }}
              onMouseDown={(e) => onMouseDownColumn(e, dayIndex)}
              className="relative select-none"
              style={{ height: totalHeight, minHeight: totalHeight, userSelect: 'none', WebkitUserSelect: 'none' }}
            >
              {/* slot rows */}
              {Array.from({ length: Math.ceil(hourCount * (60 / slotMinutes)) }).map((_, idx) => (
                <div key={idx} style={{
                  height: slotHeight,
                  borderTop: idx % (60/slotMinutes) === 0 ? '1px solid rgba(55,65,81,0.6)' : '1px solid rgba(55,65,81,0.35)'
                }} />
              ))}

              {/* events */}
              {renderEventsForDay(d, dayIndex)}

              {/* selection overlay */}
              {selection && selection.dayIndex === dayIndex && (
                <div className="absolute left-1 right-1 bg-blue-600/40 border-2 border-blue-500 rounded"
                  style={{
                    top: minutesToPx(selection.startMin - startHour * 60),
                    height: minutesToPx(selection.endMin - selection.startMin),
                    zIndex: 15
                  }} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeekCalendar;