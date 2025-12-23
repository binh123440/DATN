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
const WeekCalendar = ({ roomId, startOfWeek, startHour = 8, endHour = 22, slotMinutes = 15, onSelectRange, onSelecting }) => {
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

  // if parent passes startOfWeek prop, sync local weekStart
  useEffect(() => {
    if (startOfWeek) setWeekStart(new Date(startOfWeek));
  }, [startOfWeek]);
  
  // navigation helpers: prev / next / today
  const changeWeek = (deltaWeeks) => {
    setWeekStart(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + deltaWeeks * 7);
      d.setHours(0,0,0,0);
      return d;
    });
  };
  const goPrevWeek = () => changeWeek(-1);
  const goNextWeek = () => changeWeek(1);
  const goToday = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = (day + 6) % 7; // Monday = 0
    now.setDate(now.getDate() - diff);
    now.setHours(0,0,0,0);
    setWeekStart(now);
  };
  
  const formatWeekRange = () => {
    const a = days[0];
    const b = days[6];
    const opts = { day: 'numeric', month: 'short' };
    return `${a.toLocaleDateString('vi-VN', opts)} – ${b.toLocaleDateString('vi-VN', opts)} ${b.getFullYear()}`;
  };
  
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

  const toDateFromMinute = (day, minute) => {
    const d = new Date(day);
    d.setHours(0,0,0,0);
    d.setMinutes(minute, 0, 0);
    return d;
  };

  const onMouseDownColumn = (e, dayIndex) => {
    if (e.button !== 0) return; // only left click
    const col = e.currentTarget;
    const startMin = yToMinutes(e.clientY, col);
    selectingRef.current = true;
    pageMouse.current = { col, dayIndex, startMin };
    const initial = { dayIndex, startMin, endMin: startMin + slotMinutes };
    setSelection(initial); // show minimal

    // live callback
    if (typeof onSelecting === 'function') {
      const day = days[dayIndex];
      onSelecting({ start: toDateFromMinute(day, initial.startMin), end: toDateFromMinute(day, initial.endMin), dayIndex });
    }

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
    const sel = { dayIndex, startMin: s, endMin: t };
    setSelection(sel);

    // live callback
    if (typeof onSelecting === 'function') {
      const day = days[dayIndex];
      onSelecting({ start: toDateFromMinute(day, sel.startMin), end: toDateFromMinute(day, sel.endMin), dayIndex });
    }
  };

  const onWindowMouseUp = () => {
    if (!selectingRef.current) return;
    selectingRef.current = false;
    window.removeEventListener('mousemove', onWindowMouseMove);
    window.removeEventListener('mouseup', onWindowMouseUp);
    const sel = pageMouse.current && selection;
    if (sel && onSelectRange) {
      const day = days[sel.dayIndex];
      const start = toDateFromMinute(day, sel.startMin);
      const end = toDateFromMinute(day, sel.endMin);
      // ensure start < end
      if (end <= start) end.setMinutes(start.getMinutes() + slotMinutes);
      onSelectRange({ start, end });
    }

    // final live callback (also informs parent)
    if (sel && typeof onSelecting === 'function') {
      const day = days[sel.dayIndex];
      onSelecting({ start: toDateFromMinute(day, sel.startMin), end: toDateFromMinute(day, sel.endMin), dayIndex: sel.dayIndex });
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

  // helper to merge overlapping intervals
  const mergeIntervals = (intervals) => {
    if (!intervals.length) return [];
    intervals.sort((a, b) => a[0] - b[0]);
    const res = [intervals[0].slice()];
    for (let i = 1; i < intervals.length; i++) {
      const [s, e] = intervals[i];
      const last = res[res.length - 1];
      if (s <= last[1]) {
        last[1] = Math.max(last[1], e);
      } else {
        res.push([s, e]);
      }
    }
    return res;
  };

  // render highlight overlays for busy hours in a day
  const renderHighlightsForDay = (day, dayIndex) => {
    const ds = events.filter(ev => {
      const evStart = new Date(ev.thoi_gian_bat_dau);
      const evEnd = new Date(ev.thoi_gian_ket_thuc || ev.thoi_gian_bat_dau);
      return (Number(ev.id_phong) === Number(roomId)) &&
        evStart < new Date(day.getTime() + 24*60*60*1000) &&
        evEnd > new Date(day.getTime());
    });

    if (!ds.length) return null;

    const dayStart = new Date(day); dayStart.setHours(startHour,0,0,0);
    const minAllowed = startHour * 60;
    const maxAllowed = endHour * 60;

    const intervals = ds.map(ev => {
      const s = Math.max(0, (new Date(ev.thoi_gian_bat_dau) - dayStart) / 60000);
      const t = Math.max(0, (new Date(ev.thoi_gian_ket_thuc || ev.thoi_gian_bat_dau) - dayStart) / 60000);
      // clamp to visible hours
      const ss = Math.max(minAllowed, Math.min(maxAllowed, s + startHour * 60));
      const tt = Math.max(minAllowed, Math.min(maxAllowed, t + startHour * 60));
      return [ss - minAllowed, tt - minAllowed]; // relative minutes from calendar startHour
    }).filter(([s,t]) => t > s);

    const merged = mergeIntervals(intervals);

    return merged.map(([s, t], idx) => {
      const top = minutesToPx(s);
      const height = Math.max(slotHeight, minutesToPx(Math.max(0, t - s)));
      return (
        <div
          key={`highlight-${dayIndex}-${idx}`}
          className="absolute left-1 right-1 bg-amber-200/60 rounded"
          style={{ top, height, zIndex: 2, pointerEvents: 'none' }}
          aria-hidden="true"
        />
      );
    });
  };

  return (
    <div>
      {/* header: week navigation */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={goPrevWeek} className="px-3 py-1 bg-gray-800 text-gray-100 rounded hover:bg-gray-700">‹ Tuần trước</button>
          <button onClick={goToday} className="px-3 py-1 bg-gray-700 text-gray-100 rounded hover:bg-gray-600">Hôm nay</button>
          <button onClick={goNextWeek} className="px-3 py-1 bg-gray-800 text-gray-100 rounded hover:bg-gray-700">Tuần sau ›</button>
        </div>
        <div className="text-sm text-gray-300 font-medium">{formatWeekRange()}</div>
        <div />
      </div>

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
                {renderHighlightsForDay(d, dayIndex)}
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
    </div>
  );
};

export default WeekCalendar;