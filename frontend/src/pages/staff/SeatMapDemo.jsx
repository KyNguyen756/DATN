/**
 * SeatMapDemo.jsx  — Trang test nhanh SeatMap component
 * Truy cập: /staff/seat-demo (cần thêm route tạm thời nếu muốn test)
 *
 * KHÔNG dùng trong production — chỉ để dev check UI.
 */
import { useState, useMemo } from 'react';
import SeatMap from '../../components/SeatMap';

// Mock data — mô phỏng response từ GET /api/trip-seats/:tripId
function makeMockSeats() {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const cols  = [1, 2, 3, 4];
  const seats = [];
  let i = 0;

  rows.forEach(row => {
    cols.forEach(col => {
      const status =
        (row === 'B' && col <= 2) ? 'booked' :
        (row === 'C' && col === 3) ? 'locked' :
        'available';

      seats.push({
        _id:       `mock-${row}${col}`,
        status,
        lockedBy:  status === 'locked' ? { username: 'staff02' } : null,
        lockedUntil: status === 'locked' ? new Date(Date.now() + 8 * 60 * 1000) : null,
        seat: {
          _id:        `seat-${row}${col}`,
          seatNumber: `${row}${col}`,
          seatType:   row === 'G' ? 'vip' : 'standard',
        },
        trip: 'mock-trip-id',
      });
      i++;
    });
  });
  return seats;
}

export default function SeatMapDemo() {
  const mockSeats = useMemo(() => makeMockSeats(), []);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading]   = useState(false);

  const handleSelect = (tripSeat, action) => {
    setSelected(prev =>
      action === 'select'
        ? [...prev, tripSeat._id]
        : prev.filter(id => id !== tripSeat._id)
    );
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '24px' }}>
      <h1 style={{ fontWeight: '800', fontSize: '20px', marginBottom: '4px' }}>
        SeatMap Demo
      </h1>
      <p style={{ fontSize: '13px', color: 'var(--gray-500)', marginBottom: '24px' }}>
        Mock data — không kết nối API. Đang chọn: {selected.length} ghế
      </p>

      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setLoading(l => !l)}
          style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--gray-200)', background: 'white', cursor: 'pointer', fontSize: '12px' }}
        >
          Toggle loading skeleton
        </button>
        <button
          onClick={() => setSelected([])}
          style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--gray-200)', background: 'white', cursor: 'pointer', fontSize: '12px' }}
        >
          Bỏ chọn tất cả
        </button>
      </div>

      <div className="card" style={{ padding: '20px' }}>
        <SeatMap
          tripId={null}           // no polling in demo
          seats={mockSeats}
          selectedSeatIds={selected}
          onSeatSelect={handleSelect}
          maxSelectable={5}
          loading={loading}
          disabled={false}
        />
      </div>

      {selected.length > 0 && (
        <div className="card" style={{ padding: '16px', marginTop: '16px', fontSize: '13px' }}>
          <strong>Selected IDs:</strong>
          <pre style={{ fontSize: '11px', marginTop: '6px', color: 'var(--gray-500)' }}>
            {JSON.stringify(selected, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
