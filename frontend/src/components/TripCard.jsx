import { Bus, Clock, CheckCircle, ArrowRight } from 'lucide-react';

const typeLabels = { seater: 'Ghế ngồi', sleeper: 'Giường nằm', limousine: 'Limousine' };

const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '--:--';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : '';

const fmtDuration = (dep, arr, est) => {
  if (est) return `${Math.floor(est / 60)}h${est % 60 ? est % 60 + 'm' : ''}`;
  if (!dep || !arr) return '';
  const diff = (new Date(arr) - new Date(dep)) / 60000;
  return `${Math.floor(diff / 60)}h${diff % 60 ? Math.round(diff % 60) + 'm' : ''}`;
};

/**
 * Shared trip card used in SearchPage and HomePage.
 *
 * @param {object} trip         - Trip with populated fromStation, toStation, bus + availableSeats
 * @param {function} onSelect   - Called with trip._id when "Chọn chuyến" is clicked
 */
export default function TripCard({ trip, onSelect }) {
  const dep = fmtTime(trip.departureTime);
  const arr = fmtTime(trip.arrivalTime);
  const dur = fmtDuration(trip.departureTime, trip.arrivalTime, trip.estimatedDuration);
  const busType = typeLabels[trip.bus?.type] || trip.bus?.type || '';
  const company = trip.bus?.name || 'Nhà xe';
  const seats = trip.availableSeats;
  const isFull = seats !== undefined && seats <= 0;

  return (
    <div className="card card-hover" style={{ padding: '0', overflow: 'hidden', transition: 'all 0.25s' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto' }}>
        <div style={{ padding: '20px 24px' }}>
          {/* Company row */}
          <div className="flex items-center justify-between" style={{ marginBottom: '14px' }}>
            <div className="flex items-center gap-3">
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--primary-bg), #fff3f0)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '800', color: 'var(--primary)', fontSize: '16px',
                border: '1px solid rgba(255,107,53,0.15)',
              }}>
                {company[0]}
              </div>
              <div>
                <div style={{ fontWeight: '700', color: 'var(--gray-900)', fontSize: '14px' }}>{company}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="badge badge-info" style={{ fontSize: '11px' }}>{busType}</span>
                  {trip.bus?.licensePlate && (
                    <span style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{trip.bus.licensePlate}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-4" style={{ marginBottom: '14px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--gray-900)', lineHeight: 1 }}>{dep}</div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>{trip.fromStation?.city}</div>
              <div style={{ fontSize: '10px', color: 'var(--gray-400)' }}>{trip.fromStation?.name}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--gray-400)', fontWeight: '600' }}>{dur}</span>
              <div style={{ width: '100%', height: '2px', background: 'linear-gradient(to right, var(--primary) 0%, rgba(255,107,53,0.3) 100%)', borderRadius: '2px', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--primary)', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bus size={9} color="white" />
                </div>
              </div>
              <span style={{ fontSize: '10px', color: 'var(--gray-400)' }}>{fmtDate(trip.departureTime)}</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--gray-900)', lineHeight: 1 }}>{arr || '—'}</div>
              <div style={{ fontSize: '11px', color: 'var(--gray-500)', marginTop: '2px' }}>{trip.toStation?.city}</div>
              <div style={{ fontSize: '10px', color: 'var(--gray-400)' }}>{trip.toStation?.name}</div>
            </div>
          </div>

          {/* Amenities + seat count */}
          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
            {(trip.bus?.amenities || []).slice(0, 3).map(a => (
              <span key={a} className="tag" style={{ fontSize: '11px' }}>
                <CheckCircle size={10} color="var(--success)" style={{ marginRight: '3px' }} />{a}
              </span>
            ))}
            {seats !== undefined && (
              <span className="tag" style={{
                fontSize: '11px',
                background: isFull ? 'var(--danger-light)' : seats <= 5 ? 'var(--warning-light)' : 'var(--success-light)',
                color: isFull ? 'var(--danger)' : seats <= 5 ? 'var(--warning)' : 'var(--success)',
                fontWeight: '700'
              }}>
                {isFull ? 'Hết chỗ' : seats <= 5 ? `${seats} chỗ cuối!` : `${seats} chỗ trống`}
              </span>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div style={{
          padding: '20px', background: 'linear-gradient(180deg, var(--gray-50) 0%, white 100%)',
          minWidth: '160px', display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: '10px', borderLeft: '1px solid var(--gray-100)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--primary)', lineHeight: 1 }}>
              {trip.price?.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '2px' }}>đ / người</div>
          </div>
          {isFull ? (
            <span style={{ fontSize: '12px', color: 'var(--gray-400)', fontWeight: '600' }}>Hết chỗ</span>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--success)', fontWeight: '700' }}>✓ Còn chỗ</div>
          )}
          <button
            className="btn btn-primary"
            onClick={() => onSelect(trip._id)}
            disabled={isFull}
            style={{ justifyContent: 'center', width: '100%', opacity: isFull ? 0.5 : 1 }}
          >
            Chọn chuyến
          </button>
        </div>
      </div>
    </div>
  );
}
