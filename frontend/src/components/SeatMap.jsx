import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Lock, X, CheckCircle2, Loader, Wifi, WifiOff, Users, AlertCircle } from 'lucide-react';
import api from '../api/axios';

// ── Constants ─────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 10_000; // 10 seconds

const STATUS = {
  AVAILABLE: 'available',
  LOCKED:    'locked',
  BOOKED:    'booked',
};

// ── Seat status visual config ─────────────────────────────────────────────────
const SEAT_CFG = {
  available: {
    bg:     '#DCFCE7',
    border: '#16A34A',
    color:  '#15803D',
    hover:  '#BBF7D0',
    cursor: 'pointer',
    label:  'Trống',
  },
  locked: {
    bg:     '#FEF9C3',
    border: '#CA8A04',
    color:  '#92400E',
    hover:  '#FEF9C3',
    cursor: 'not-allowed',
    label:  'Đang giữ',
  },
  booked: {
    bg:     '#FEE2E2',
    border: '#DC2626',
    color:  '#B91C1C',
    hover:  '#FEE2E2',
    cursor: 'not-allowed',
    label:  'Đã đặt',
  },
  selected: {
    bg:     'rgba(255,107,53,0.15)',
    border: 'var(--primary, #FF6B35)',
    color:  'var(--primary, #FF6B35)',
    hover:  'rgba(255,107,53,0.22)',
    cursor: 'pointer',
    label:  'Đang chọn',
  },
};

// ── Utility: parse seat row from seatNumber ───────────────────────────────────
// Supports: "A1", "A2", "B01", "01", "1", "Cabin A1" etc.
function parseRow(seatNumber = '') {
  const match = seatNumber.match(/^([A-Za-z]+)/);
  return match ? match[1].toUpperCase() : '#';
}
function parseNum(seatNumber = '') {
  const match = seatNumber.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

// ── Utility: determine aisle split position ───────────────────────────────────
// Returns how many seats go on the LEFT of the aisle.
// Standard Vietnam bus layouts:
//   4 seats/row (Ghế ngồi): 2 | 2
//   3 seats/row (Giường nằm): 1 | 2 or 2 | 1
//   2 seats/row (VIP):        1 | 1
function getAisleSplit(maxSeatsPerRow) {
  if (maxSeatsPerRow <= 2) return 1;   // 1 | 1
  if (maxSeatsPerRow === 3) return 1;  // 1 | 2
  return Math.floor(maxSeatsPerRow / 2); // 2|2, 3|3, etc.
}

// ── Skeleton seat ─────────────────────────────────────────────────────────────
const SkeletonSeat = () => (
  <div style={{
    width: '52px', height: '44px', borderRadius: '10px',
    background: 'linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%)',
    backgroundSize: '200% 100%',
    animation: 'seatShimmer 1.4s infinite',
    flexShrink: 0,
  }} />
);

// ── Single Seat Button ─────────────────────────────────────────────────────────
function SeatButton({ tripSeat, isSelected, isMyLock, onClick, disabled }) {
  const [hovered, setHovered] = useState(false);

  const seatNum = tripSeat.seat?.seatNumber || '?';
  const seatType = tripSeat.seat?.seatType;
  const status  = tripSeat.status;

  const isBooked       = status === STATUS.BOOKED;
  const isLockedOther  = status === STATUS.LOCKED && !isSelected;
  const isClickable    = !disabled && !isBooked && !isLockedOther;

  const cfg = isSelected
    ? SEAT_CFG.selected
    : SEAT_CFG[status] || SEAT_CFG.available;

  const bg     = isClickable && hovered ? cfg.hover : cfg.bg;
  const border = cfg.border;
  const color  = cfg.color;

  return (
    <button
      title={`Ghế ${seatNum} — ${isSelected ? 'Đang chọn' : cfg.label}${seatType ? ` (${seatType})` : ''}`}
      onClick={() => isClickable && onClick(tripSeat)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '52px', height: '44px', borderRadius: '10px',
        background: bg,
        border: `2px solid ${border}`,
        color,
        fontSize: '11px', fontWeight: '700', fontFamily: 'monospace',
        cursor: cfg.cursor,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1px',
        transition: 'all 0.15s ease',
        transform: isSelected ? 'scale(1.08)' : 'scale(1)',
        boxShadow: isSelected ? `0 2px 8px ${border}55` : 'none',
        position: 'relative',
        flexShrink: 0,
        outline: 'none',
      }}
    >
      {/* Status icon overlay */}
      {isBooked && (
        <div style={{ position: 'absolute', top: '2px', right: '3px' }}>
          <X size={9} strokeWidth={3} />
        </div>
      )}
      {isLockedOther && (
        <div style={{ position: 'absolute', top: '2px', right: '3px' }}>
          <Lock size={9} strokeWidth={3} />
        </div>
      )}
      {isSelected && (
        <div style={{ position: 'absolute', top: '2px', right: '3px', color: 'var(--primary)' }}>
          <CheckCircle2 size={9} strokeWidth={3} />
        </div>
      )}

      {/* Seat number */}
      <span style={{ lineHeight: 1, fontSize: '11px' }}>{seatNum}</span>

      {/* Seat type indicator dot */}
      {seatType && (
        <span style={{ fontSize: '8px', opacity: 0.6, lineHeight: 1 }}>
          {seatType === 'sleeper' ? '🛏' : seatType === 'vip' ? '★' : ''}
        </span>
      )}
    </button>
  );
}

// ── Main SeatMap Component ────────────────────────────────────────────────────
/**
 * SeatMap
 *
 * @param {string}   tripId         — used for realtime polling
 * @param {object[]} seats          — initial TripSeat[] from parent
 * @param {string[]|Set} selectedSeatIds — externally controlled selection
 * @param {function} onSeatSelect   — (tripSeat, action: 'select'|'deselect') => void
 * @param {number}   maxSelectable  — default 5
 * @param {boolean}  loading        — show skeleton
 * @param {boolean}  disabled       — disable all clicks
 */
export default function SeatMap({
  tripId,
  seats: initialSeats = [],
  selectedSeatIds = [],
  onSeatSelect,
  maxSelectable = 5,
  loading = false,
  disabled = false,
}) {
  const [seats,       setSeats]       = useState(initialSeats);
  const [pollStatus,  setPollStatus]  = useState('idle');  // 'idle' | 'polling' | 'ok' | 'error'
  const [lastPollAt,  setLastPollAt]  = useState(null);
  const [maxReached,  setMaxReached]  = useState(false);
  const maxReachedTimer = useRef(null);

  // Sync internal seats when prop changes (initial load / trip change)
  useEffect(() => {
    setSeats(initialSeats);
  }, [initialSeats]);

  // Derived: selectedSet for O(1) lookup
  const selectedSet = useMemo(() => {
    const arr = Array.isArray(selectedSeatIds)
      ? selectedSeatIds
      : [...selectedSeatIds];
    return new Set(arr);
  }, [selectedSeatIds]);

  // ── Polling ─────────────────────────────────────────────────────────────
  const pollSeats = useCallback(async () => {
    if (!tripId) return;
    setPollStatus('polling');
    try {
      const { data } = await api.get(`/trip-seats/${tripId}`);
      const fresh = data || [];

      // Merge: update status from server, but preserve UI for selected seats
      setSeats(prev => {
        const prevMap = new Map(prev.map(s => [s._id, s]));
        return fresh.map(s => {
          // Keep locally-selected seat as "selected" state reference
          const kept = prevMap.get(s._id);
          return { ...s, ...(kept?.__localOverride ? { __localOverride: true } : {}) };
        });
      });

      setLastPollAt(new Date());
      setPollStatus('ok');
    } catch {
      setPollStatus('error');
    }
  }, [tripId]);

  useEffect(() => {
    if (!tripId) return;
    const interval = setInterval(pollSeats, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [tripId, pollSeats]);

  // ── Seat click ───────────────────────────────────────────────────────────
  const handleSeatClick = useCallback((tripSeat) => {
    if (disabled) return;
    const isSelected = selectedSet.has(tripSeat._id);

    if (isSelected) {
      onSeatSelect?.(tripSeat, 'deselect');
    } else {
      if (selectedSet.size >= maxSelectable) {
        // Flash "max reached" warning
        setMaxReached(true);
        clearTimeout(maxReachedTimer.current);
        maxReachedTimer.current = setTimeout(() => setMaxReached(false), 2000);
        return;
      }
      onSeatSelect?.(tripSeat, 'select');
    }
  }, [disabled, selectedSet, maxSelectable, onSeatSelect]);

  // ── Group seats by row ──────────────────────────────────────────────────
  const { rowOrder, seatsByRow, maxPerRow } = useMemo(() => {
    const rows = {};
    let max = 0;

    seats.forEach(ts => {
      const rowKey = ts.seat?.seatNumber
        ? parseRow(ts.seat.seatNumber)
        : '?';
      if (!rows[rowKey]) rows[rowKey] = [];
      rows[rowKey].push(ts);
    });

    // Sort seats within each row by numeric part
    Object.values(rows).forEach(rowSeats => {
      rowSeats.sort((a, b) =>
        parseNum(a.seat?.seatNumber) - parseNum(b.seat?.seatNumber)
      );
      if (rowSeats.length > max) max = rowSeats.length;
    });

    // Sort row keys: A, B, C... then # fallback
    const order = Object.keys(rows).sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    });

    return { rowOrder: order, seatsByRow: rows, maxPerRow: max };
  }, [seats]);

  const aisleSplit = getAisleSplit(maxPerRow);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    let available = 0, locked = 0, booked = 0;
    seats.forEach(s => {
      if (s.status === STATUS.AVAILABLE) available++;
      else if (s.status === STATUS.LOCKED) locked++;
      else if (s.status === STATUS.BOOKED) booked++;
    });
    return { available, locked, booked, total: seats.length };
  }, [seats]);

  const availablePct = stats.total > 0 ? (stats.available / stats.total) * 100 : 0;

  // ── Poll status badge ────────────────────────────────────────────────────
  const pollBadge = (() => {
    if (pollStatus === 'polling') return { color: '#3B82F6', label: '● Đang cập nhật' };
    if (pollStatus === 'error')   return { color: '#DC2626', label: '● Mất kết nối' };
    if (pollStatus === 'ok')      return { color: '#16A34A', label: '● Live' };
    return { color: '#9CA3AF', label: '○ Chờ cập nhật' };
  })();

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading && seats.length === 0) {
    return (
      <div>
        {/* Skeleton header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ width: '120px', height: '20px', borderRadius: '6px', background: '#E5E7EB', animation: 'seatShimmer 1.4s infinite', backgroundSize: '200% 100%' }} />
          <div style={{ width: '60px', height: '20px', borderRadius: '6px', background: '#E5E7EB', animation: 'seatShimmer 1.4s infinite', backgroundSize: '200% 100%' }} />
        </div>

        {/* BusFrame skeleton */}
        <div style={{
          background: 'var(--gray-50, #F9FAFB)',
          border: '2px solid var(--gray-200, #E5E7EB)',
          borderRadius: '16px',
          padding: '20px 16px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          {/* Driver row */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <div style={{ width: '60px', height: '32px', borderRadius: '10px', background: '#E5E7EB', animation: 'seatShimmer 1.4s infinite', backgroundSize: '200% 100%' }} />
          </div>
          {/* Seat rows skeleton */}
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
              <SkeletonSeat />
              <SkeletonSeat />
              <div style={{ width: '20px' }} />
              <SkeletonSeat />
              <SkeletonSeat />
            </div>
          ))}
        </div>
        <style>{`@keyframes seatShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!loading && seats.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gray-400, #9CA3AF)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🚌</div>
        <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>Chưa có sơ đồ ghế</div>
        <div style={{ fontSize: '12px' }}>Chuyến này chưa được tạo ghế. Vào trang Admin → Chuyến đi để tạo ghế.</div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div style={{ userSelect: 'none' }}>

      {/* ── Header: stats + poll badge ──────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gray-800, #1F2937)' }}>
            {stats.available} ghế trống / {stats.total} tổng
          </span>

          {selectedSet.size > 0 && (
            <span style={{
              padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
              background: 'rgba(255,107,53,0.12)', color: 'var(--primary, #FF6B35)',
              border: '1px solid rgba(255,107,53,0.3)',
            }}>
              Đang chọn {selectedSet.size}/{maxSelectable}
            </span>
          )}
        </div>

        {/* Live badge */}
        {tripId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: pollBadge.color, fontWeight: '600' }}>
            {pollStatus === 'polling'
              ? <Loader size={10} style={{ animation: 'spinSeat 1s linear infinite' }} />
              : pollStatus === 'error'
              ? <WifiOff size={10} />
              : <Wifi size={10} />
            }
            {pollBadge.label}
            {lastPollAt && (
              <span style={{ color: 'var(--gray-400, #9CA3AF)', fontWeight: 400 }}>
                {lastPollAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Progress bar ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ height: '6px', borderRadius: '3px', background: '#E5E7EB', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: '3px',
            background: availablePct > 40 ? '#16A34A' : availablePct > 15 ? '#CA8A04' : '#DC2626',
            width: `${availablePct}%`,
            transition: 'width 0.5s ease, background 0.3s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px', fontSize: '10px', color: 'var(--gray-400, #9CA3AF)' }}>
          <span>{stats.available} trống</span>
          <span style={{ color: '#CA8A04' }}>{stats.locked} đang giữ</span>
          <span style={{ color: '#DC2626' }}>{stats.booked} đã đặt</span>
        </div>
      </div>

      {/* ── Max reached warning ───────────────────────────────────────── */}
      {maxReached && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '8px 12px', borderRadius: '8px', marginBottom: '10px',
          background: '#FFFBEB', border: '1px solid #FDE68A',
          color: '#92400E', fontSize: '12px', fontWeight: '600',
          animation: 'fadeIn 0.2s ease',
        }}>
          <AlertCircle size={13} />
          Chỉ được chọn tối đa {maxSelectable} ghế
        </div>
      )}

      {/* ── Bus frame ────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--gray-50, #F9FAFB)',
        border: '2.5px solid var(--gray-200, #E5E7EB)',
        borderRadius: '20px',
        padding: '16px 14px 20px',
        position: 'relative',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
      }}>
        {/* Bus top — driver section */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          marginBottom: '16px', gap: '8px',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 14px', borderRadius: '10px',
            background: 'var(--gray-200, #E5E7EB)',
            fontSize: '11px', fontWeight: '700', color: 'var(--gray-600, #4B5563)',
          }}>
            <span>🚗</span> Tài xế
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '2px', background: 'var(--gray-200, #E5E7EB)', marginBottom: '14px', borderRadius: '1px' }} />

        {/* Seat rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          {rowOrder.map(rowKey => {
            const rowSeats = seatsByRow[rowKey] || [];
            const leftSeats  = rowSeats.slice(0, aisleSplit);
            const rightSeats = rowSeats.slice(aisleSplit);

            return (
              <div key={rowKey} style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'center' }}>
                {/* Row label */}
                <div style={{
                  width: '20px', flexShrink: 0,
                  fontSize: '10px', fontWeight: '700',
                  color: 'var(--gray-400, #9CA3AF)',
                  textAlign: 'right',
                }}>
                  {rowKey !== '#' ? rowKey : ''}
                </div>

                {/* Left seats */}
                <div style={{ display: 'flex', gap: '5px' }}>
                  {leftSeats.map(ts => (
                    <SeatButton
                      key={ts._id}
                      tripSeat={ts}
                      isSelected={selectedSet.has(ts._id)}
                      isMyLock={ts.status === STATUS.LOCKED && selectedSet.has(ts._id)}
                      onClick={handleSeatClick}
                      disabled={disabled}
                    />
                  ))}
                </div>

                {/* Aisle */}
                {maxPerRow > 2 && (
                  <div style={{
                    width: '22px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{
                      width: '2px', height: '36px',
                      background: 'linear-gradient(to bottom, transparent, var(--gray-300, #D1D5DB), transparent)',
                      borderRadius: '1px',
                    }} />
                  </div>
                )}

                {/* Right seats */}
                <div style={{ display: 'flex', gap: '5px' }}>
                  {rightSeats.map(ts => (
                    <SeatButton
                      key={ts._id}
                      tripSeat={ts}
                      isSelected={selectedSet.has(ts._id)}
                      isMyLock={ts.status === STATUS.LOCKED && selectedSet.has(ts._id)}
                      onClick={handleSeatClick}
                      disabled={disabled}
                    />
                  ))}
                </div>

                {/* Spacer for alignment */}
                <div style={{ width: '20px', flexShrink: 0 }} />
              </div>
            );
          })}
        </div>

        {/* Bus bottom */}
        <div style={{ height: '2px', background: 'var(--gray-200, #E5E7EB)', marginTop: '14px', borderRadius: '1px' }} />
        <div style={{
          display: 'flex', justifyContent: 'center', marginTop: '10px',
          fontSize: '10px', color: 'var(--gray-400, #9CA3AF)', fontWeight: '600',
        }}>
          ▼ Cửa xe
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '14px' }}>
        {[
          { status: 'available', icon: null,           label: 'Trống' },
          { status: 'selected',  icon: <CheckCircle2 size={9} />, label: 'Đang chọn' },
          { status: 'locked',    icon: <Lock size={9} />,         label: 'Đang giữ' },
          { status: 'booked',    icon: <X size={9} />,            label: 'Đã đặt' },
        ].map(({ status, icon, label }) => {
          const cfg = SEAT_CFG[status];
          return (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--gray-500, #6B7280)', fontWeight: '500' }}>
              <div style={{
                width: '18px', height: '18px', borderRadius: '4px',
                background: cfg.bg, border: `1.5px solid ${cfg.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: cfg.color,
              }}>
                {icon}
              </div>
              {label}
            </div>
          );
        })}
      </div>

      {/* ── Selected seats summary ───────────────────────────────────── */}
      {selectedSet.size > 0 && (
        <div style={{
          marginTop: '12px', padding: '10px 14px', borderRadius: '10px',
          background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.2)',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '12px', fontWeight: '600', color: 'var(--primary, #FF6B35)',
        }}>
          <Users size={13} />
          <span>
            Đã chọn ({selectedSet.size}):&nbsp;
            {seats
              .filter(s => selectedSet.has(s._id))
              .map(s => s.seat?.seatNumber || '?')
              .join(', ')
            }
          </span>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes seatShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spinSeat { to { transform: rotate(360deg); } }
        @keyframes fadeIn   { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
