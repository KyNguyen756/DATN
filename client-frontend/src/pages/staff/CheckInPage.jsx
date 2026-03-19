import { useState } from 'react';
import { QrCode, CheckCircle, X, Search, User, Bus, Clock } from 'lucide-react';

const passengers = [
  { id: 'VXB-123456', name: 'Nguyễn Văn A', phone: '0901234567', seat: 'A1', status: 'pending', type: 'Limousine' },
  { id: 'VXB-234567', name: 'Trần Thị B', phone: '0912345678', seat: 'B3', status: 'checked', type: 'Limousine' },
  { id: 'VXB-345678', name: 'Lê Văn C', phone: '0923456789', seat: 'C2', status: 'pending', type: 'Limousine' },
  { id: 'VXB-456789', name: 'Phạm Thị D', phone: '0934567890', seat: 'D4', status: 'checked', type: 'Limousine' },
  { id: 'VXB-567890', name: 'Hoàng Văn E', phone: '0945678901', seat: 'E1', status: 'pending', type: 'Limousine' },
];

export default function CheckInPage() {
  const [qrInput, setQrInput] = useState('');
  const [list, setList] = useState(passengers);
  const [scanResult, setScanResult] = useState(null);
  const [search, setSearch] = useState('');

  const handleScan = () => {
    const found = list.find(p => p.id === qrInput.trim() || p.phone === qrInput.trim());
    if (found) {
      setScanResult({ ...found, success: true });
      setList(prev => prev.map(p => p.id === found.id ? { ...p, status: 'checked' } : p));
    } else {
      setScanResult({ success: false, id: qrInput });
    }
    setQrInput('');
  };

  const checkedCount = list.filter(p => p.status === 'checked').length;
  const filtered = list.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.includes(search) ||
    p.seat.includes(search)
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="section-title">Check-in hành khách</h1>
          <p className="section-subtitle">Scan QR vé hoặc tìm kiếm để xác nhận lên xe</p>
        </div>
        <span className="badge badge-info" style={{ fontSize: '13px', padding: '6px 14px' }}>
          <Bus size={13} /> Phương Trang - 07:00 - TP.HCM → Đà Lạt
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '20px' }}>
        {/* Scanner */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* QR scan box */}
          <div className="card" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{
              width: '180px', height: '180px', borderRadius: '16px',
              border: '3px dashed var(--primary)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', gap: '10px', background: 'var(--primary-bg)',
              animation: 'pulse 2s ease infinite',
            }}>
              <QrCode size={60} color="var(--primary)" />
              <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600' }}>Quét QR hoặc nhập mã</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="form-input"
                placeholder="Nhập mã vé hoặc SĐT..."
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
                style={{ flex: 1 }}
              />
              <button className="btn btn-primary" onClick={handleScan} style={{ padding: '11px 16px' }}>
                <QrCode size={16} />
              </button>
            </div>
          </div>

          {/* Scan result */}
          {scanResult && (
            <div className="card" style={{
              padding: '20px', animation: 'slideUp 0.3s ease',
              border: `2px solid ${scanResult.success ? 'var(--success)' : 'var(--danger)'}`,
            }}>
              {scanResult.success ? (
                <>
                  <div className="flex items-center gap-3" style={{ marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={22} color="var(--success)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', color: 'var(--success)', fontSize: '15px' }}>Check-in thành công!</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Hành khách đã lên xe</div>
                    </div>
                  </div>
                  <div style={{ background: 'var(--success-light)', borderRadius: '10px', padding: '12px', fontSize: '13px' }}>
                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>{scanResult.name}</div>
                    <div style={{ color: 'var(--gray-600)' }}>Ghế: {scanResult.seat} · {scanResult.phone}</div>
                    <div style={{ color: 'var(--gray-600)', fontFamily: 'monospace', fontSize: '12px', marginTop: '4px' }}>{scanResult.id}</div>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={22} color="var(--danger)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', color: 'var(--danger)' }}>Không tìm thấy vé</div>
                    <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Mã: {scanResult.id}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Progress */}
          <div className="card" style={{ padding: '20px' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '10px' }}>
              <span style={{ fontWeight: '700', fontSize: '14px' }}>Tiến độ check-in</span>
              <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '16px' }}>{checkedCount}/{list.length}</span>
            </div>
            <div style={{ height: '8px', background: 'var(--gray-200)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '4px',
                width: `${(checkedCount / list.length) * 100}%`,
                background: 'linear-gradient(to right, var(--success), #16A34A)',
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '8px' }}>
              {list.length - checkedCount} hành khách chưa check-in
            </div>
          </div>
        </div>

        {/* Passenger list */}
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="relative" style={{ flex: 1 }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
              <input
                className="form-input"
                placeholder="Tìm tên, mã vé, số ghế..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
            </div>
            <span className="badge badge-success">{checkedCount} đã check-in</span>
            <span className="badge badge-warning">{list.length - checkedCount} chờ</span>
          </div>
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Mã vé</th>
                  <th>Hành khách</th>
                  <th>Ghế</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: '600', color: 'var(--primary)' }}>{p.id}</td>
                    <td>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{p.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--gray-400)' }}>{p.phone}</div>
                    </td>
                    <td>
                      <span style={{ background: 'var(--gray-100)', color: 'var(--gray-700)', padding: '3px 10px', borderRadius: '6px', fontWeight: '700', fontFamily: 'monospace' }}>{p.seat}</span>
                    </td>
                    <td>
                      {p.status === 'checked'
                        ? <span className="badge badge-success"><CheckCircle size={10} /> Đã check-in</span>
                        : <span className="badge badge-warning"><Clock size={10} /> Chờ check-in</span>
                      }
                    </td>
                    <td>
                      {p.status === 'pending' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => setList(prev => prev.map(x => x.id === p.id ? { ...x, status: 'checked' } : x))}
                        >
                          <CheckCircle size={13} /> Check-in
                        </button>
                      )}
                      {p.status === 'checked' && (
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setList(prev => prev.map(x => x.id === p.id ? { ...x, status: 'pending' } : x))}
                        >Hoàn tác</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
