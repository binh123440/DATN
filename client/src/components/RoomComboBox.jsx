import React, { useEffect, useRef, useState } from 'react';
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

/**
 * RoomComboBox (enhanced):
 * - Gợi ý phòng từ DB
 * - Cho nhập text tự do qua onInputChange
 *
 * Props:
 * - value: room | null (giữ tương thích code cũ)
 * - onChange(room|null): chọn phòng (hoặc null khi user gõ để nhập tự do)
 * - onInputChange(text): nhận text user nhập (để lưu "địa điểm")
 * - inputValue (optional): controlled text (nếu muốn)
 */
const RoomComboBox = ({
  value,
  onChange,
  onInputChange,
  inputValue,
  placeholder = 'Chọn phòng hoặc nhập địa điểm...'
}) => {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);

  const isControlledText = inputValue !== undefined;
  const [query, setQuery] = useState(inputValue ?? value?.ten_phong ?? '');
  const debounced = useDebounce(query, 300);

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // Sync text khi controlled
  useEffect(() => {
    if (isControlledText) setQuery(inputValue ?? '');
  }, [isControlledText, inputValue]);

  // Khi parent set value (room) mà không controlled text -> cập nhật input
  useEffect(() => {
    if (!isControlledText && !open) setQuery(value?.ten_phong ?? '');
  }, [value, isControlledText, open]);

  useEffect(() => {
    let mounted = true;

    const fetch = async () => {
      if (!open) return;
      setLoading(true);
      try {
        const resp = await layDanhSachPhong(debounced);
        if (!mounted) return;
        setRooms(resp?.success ? (resp.data || []) : []);
      } catch {
        if (!mounted) return;
        setRooms([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetch();
    return () => { mounted = false; };
  }, [debounced, open]);

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const setText = (text) => {
    if (!isControlledText) setQuery(text);
    onInputChange?.(text);
  };

  const handleTyping = (text) => {
    // User gõ => coi như đang nhập tự do => bỏ chọn phòng (nếu có)
    if (value) onChange?.(null);
    setText(text);
    setOpen(true);
  };

  const handleSelect = (room) => {
    onChange?.(room);
    setText(room?.ten_phong || '');
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <input
        type="text"
        placeholder={placeholder}
        value={isControlledText ? (inputValue ?? '') : query}
        onFocus={() => setOpen(true)}
        onChange={(e) => handleTyping(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setOpen(false);
          if (e.key === 'Escape') setOpen(false);
        }}
        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-300 outline-none"
      />

      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-60 overflow-auto">
          <div className="p-2 text-xs text-gray-500">
            Gõ để nhập địa điểm hoặc chọn phòng gợi ý
          </div>

          {loading && <div className="p-2 text-sm text-gray-500">Đang tải...</div>}
          {!loading && rooms.length === 0 && (
            <div className="p-2 text-sm text-gray-500">Không tìm thấy phòng (vẫn có thể dùng địa điểm bạn đã nhập)</div>
          )}

          {rooms.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => handleSelect(r)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 flex justify-between items-center"
            >
              <span className="truncate">{r.ten_phong}</span>
              <small className="text-gray-400">{r.toa || r.co_so || ''}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoomComboBox;