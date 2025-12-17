import React, { useState, useEffect, useRef } from 'react';
import { layDanhSachPhong } from '../services/apiService';

// Simple debounce
function useDebounce(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

const RoomComboBox = ({ value, onChange, placeholder = 'Chọn phòng hoặc tìm kiếm...' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open && !value) setQuery('');
  }, [open, value]);

  useEffect(() => {
    let mounted = true;
    const fetch = async () => {
      setLoading(true);
      try {
        const resp = await layDanhSachPhong(debounced);
        if (!mounted) return;
        // resp expected { success, data: [...] } per project conventions
        setRooms((resp && resp.success) ? resp.data : []);
      } catch (e) {
        setRooms([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    if (debounced !== undefined) fetch();
    return () => { mounted = false; };
  }, [debounced]);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleSelect = (room) => {
    onChange?.(room);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <div>
        <input
          type="text"
          placeholder={placeholder}
          value={value?.ten_phong || query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none"
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-60 overflow-auto">
          <div className="p-2 text-xs text-gray-500">Tìm kiếm theo tên phòng, tòa, cơ sở...</div>
          {loading && <div className="p-2 text-sm text-gray-500">Đang tải...</div>}
          {!loading && rooms.length === 0 && <div className="p-2 text-sm text-gray-500">Không tìm thấy phòng</div>}
          {rooms.map(r => (
            <button
              key={r.id}
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 flex justify-between items-center"
            >
              <span>{r.ten_phong}</span>
              <small className="text-gray-400">{r.toa || r.co_so || ''}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomComboBox;