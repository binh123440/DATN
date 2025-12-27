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
const WeekCalendar = ({ roomId, startOfWeek, startHour = 8, endHour = 22, slotMinutes = 15, onSelectRange, onSelecting, clearKey }) => {
  const containerRef = useRef(null);
  // persistent selection kept after mouseup
  const [persistentSelection, setPersistentSelection] = useState(null); // { dayIndex, startMin, endMin }
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
  // clear persistent selection if parent requests
  useEffect(() => {
    if (typeof clearKey !== 'undefined') setPersistentSelection(null);
  }, [clearKey]);
  
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

  // --- Busy intervals (to prevent overlap selections) ---
  const dayStartMidnight = (day) => {
    const d = new Date(day);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const mergeIntervals = (intervals) => {
    if (!intervals.length) return [];
    const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
    const res = [sorted[0].slice()];
    for (let i = 1; i < sorted.length; i++) {
      const [s, e] = sorted[i];
      const last = res[res.length - 1];
      if (s <= last[1]) {
        last[1] = Math.max(last[1], e);
      } else {
        res.push([s, e]);
      }
    }
    return res;
  };

  const busyByDayIndex = useMemo(() => {
    if (!roomId || !Array.isArray(events) || !days?.length) return Array.from({ length: 7 }, () => []);
    const minAllowed = startHour * 60;
    const maxAllowed = endHour * 60;

    return days.map((day) => {
      const day0 = dayStartMidnight(day);
      const day1 = new Date(day0);
      day1.setDate(day1.getDate() + 1);

      const intervals = events
        .filter((ev) => Number(ev.id_phong) === Number(roomId))
        .map((ev) => {
          const evStart = new Date(ev.thoi_gian_bat_dau);
          const evEnd = new Date(ev.thoi_gian_ket_thuc || ev.thoi_gian_bat_dau);
          if (!(evStart < day1 && evEnd > day0)) return null; // no intersection with day

          const sDate = evStart < day0 ? day0 : evStart;
          const eDate = evEnd > day1 ? day1 : evEnd;
          let sMin = Math.floor((sDate - day0) / 60000);
          let eMin = Math.ceil((eDate - day0) / 60000);

          // clamp to visible hours
          sMin = Math.max(minAllowed, Math.min(sMin, maxAllowed));
          eMin = Math.max(minAllowed, Math.min(eMin, maxAllowed));
          if (eMin <= sMin) return null;
          return [sMin, eMin];
        })
        .filter(Boolean);

      return mergeIntervals(intervals);
    });
  }, [events, days, roomId, startHour, endHour]);

  const isOverlappingBusy = (dayIndex, startMin, endMin) => {
    const busy = busyByDayIndex?.[dayIndex] || [];
    for (const [bs, be] of busy) {
      if (startMin < be && endMin > bs) return true;
    }
    return false;
  };

  // selection state
  const [selection, setSelection] = useState(null); // { dayIndex, startMin, endMin, isValid }
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
    // start new selection: remove previous persistent highlight
    setPersistentSelection(null);
    const col = e.currentTarget;
    const startMin = yToMinutes(e.clientY, col);
    selectingRef.current = true;
    pageMouse.current = { col, dayIndex, startMin };
    const initialStart = startMin;
    const initialEnd = startMin + slotMinutes;
    const isValid = !isOverlappingBusy(dayIndex, initialStart, initialEnd);
    const initial = { dayIndex, startMin: initialStart, endMin: initialEnd, isValid };
    setSelection(initial); // show minimal

    // live callback
    if (typeof onSelecting === 'function') {
      const day = days[dayIndex];
      onSelecting({
        start: toDateFromMinute(day, initial.startMin),
        end: toDateFromMinute(day, initial.endMin),
        dayIndex,
        isValid
      });
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
    const isValid = !isOverlappingBusy(dayIndex, s, t);
    const sel = { dayIndex, startMin: s, endMin: t, isValid };
    setSelection(sel);

    // live callback
    if (typeof onSelecting === 'function') {
      const day = days[dayIndex];
      onSelecting({
        start: toDateFromMinute(day, sel.startMin),
        end: toDateFromMinute(day, sel.endMin),
        dayIndex,
        isValid
      });
    }
  };

  // Accept event so we can compute end position immediately (handles case where `selection` state
  // hasn't been flushed yet). This ensures persistentSelection is set reliably on mouseup.
  const onWindowMouseUp = (e) => {
    if (!selectingRef.current) return;
    selectingRef.current = false;
    window.removeEventListener('mousemove', onWindowMouseMove);
    window.removeEventListener('mouseup', onWindowMouseUp);

    // Try to use current transient selection; if it's not set yet, compute using mouse event
    let sel = selection;
    const { col, dayIndex, startMin } = pageMouse.current || {};
    if (!sel && col && typeof e?.clientY === 'number') {
      const endMinRaw = yToMinutes(e.clientY, col);
      let s = Math.min(startMin, endMinRaw);
      let t = Math.max(startMin, endMinRaw);
      if (t === s) t = s + slotMinutes;
      const minAllowed = startHour * 60;
      const maxAllowed = endHour * 60;
      s = Math.max(minAllowed, Math.min(s, maxAllowed - slotMinutes));
      t = Math.max(minAllowed + slotMinutes, Math.min(t, maxAllowed));
      const isValid = !isOverlappingBusy(dayIndex, s, t);
      sel = { dayIndex, startMin: s, endMin: t, isValid };
    }

    if (sel && typeof onSelecting === 'function') {
      const day = days[sel.dayIndex];
      onSelecting({
        start: toDateFromMinute(day, sel.startMin),
        end: toDateFromMinute(day, sel.endMin),
        dayIndex: sel.dayIndex,
        isValid: !!sel.isValid
      });
    }

    // If overlaps existing events => do NOT accept selection
    if (sel && sel.isValid && onSelectRange) {
      const day = days[sel.dayIndex];
      const start = toDateFromMinute(day, sel.startMin);
      const end = toDateFromMinute(day, sel.endMin);
      if (end <= start) end.setMinutes(start.getMinutes() + slotMinutes);
      onSelectRange({ start, end });
      setPersistentSelection({ dayIndex: sel.dayIndex, startMin: sel.startMin, endMin: sel.endMin, isValid: true });
    } else {
      // keep a persistent invalid overlay so user sees it's blocked
      if (sel) setPersistentSelection({ dayIndex: sel.dayIndex, startMin: sel.startMin, endMin: sel.endMin, isValid: false });
    }

    setSelection(null);
    pageMouse.current = {};
  };

  // show transient (dragging) OR persistent (after mouseup)
  const selToShow = selection || persistentSelection;

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
          style={{ top, height, zIndex: 10 }}
          onMouseDown={(e) => e.stopPropagation()}>
          <div className="font-medium truncate">{ev.ten_su_kien}</div>
          <div className="text-[10px] opacity-80 truncate">
            {new Date(ev.thoi_gian_bat_dau).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(ev.thoi_gian_ket_thuc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      );
    });
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
            {Array.from({ length: hourCount }).map((_, i) => {
              const hour = startHour + i;
              return (
                <div key={i} className="flex items-start" style={{ height: hourHeight, borderTop: '1px solid rgba(55,65,81,0.6)' }}>
                  <div className="w-full text-right pr-2">{String(hour).padStart(2,'0')}:00</div>
                </div>
              );
            })}
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

                {/* selection overlay (transient or persistent) */}
                {(selToShow && selToShow.dayIndex === dayIndex) && (
                  <div
                    className={`absolute left-1 right-1 rounded border-2 ${selToShow.isValid === false ? 'bg-red-600/35 border-red-500' : 'bg-blue-600/40 border-blue-500'}`}
                    style={{
                      top: minutesToPx(selToShow.startMin - startHour * 60),
                      height: minutesToPx(selToShow.endMin - selToShow.startMin),
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