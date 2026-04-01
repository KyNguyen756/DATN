import { useState, useEffect, useRef, useCallback } from 'react';
import {
  QrCode, CheckCircle, X, Search, Loader, Camera,
  CameraOff, RotateCcw, Clock, User, Bus, MapPin,
  Phone, Ticket, AlertCircle, Hash, ChevronDown,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../../api/axios';

// ── Formatters ────────────────────────────────────────────────────────────────
const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }) : '--:--';
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }) : '';
const fmtNow = () =>
  new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });

// ── QR content parser ─────────────────────────────────────────────────────────
// Our QR stores: JSON { ticketId, code } OR plain code string (VXB-XXXXXX)
function parseQrContent(raw) {
  if (!raw) return { code: null, ticketId: null };
  try {
    const obj = JSON.parse(raw);
    return { ticketId: obj.ticketId || null, code: obj.code || null };
  } catch {
    // plain text — treat as code
    return { code: raw.trim().toUpperCase(), ticketId: null };
  }
}

// ── Sound feedback ────────────────────────────────────────────────────────────
function beep(frequency = 880, durationMs = 120, type = 'sine') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type; osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + durationMs / 1000);
    setTimeout(() => ctx.close(), durationMs + 50);
  } catch { /* ignore */ }
}

const beepSuccess = () => beep(1046, 100);   // C5 – high, pleasant
const beepError   = () => { beep(220, 180, 'sawtooth'); }; // low buzz

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2800); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
      padding: '12px 18px', borderRadius: '10px',
      background: type === 'success' ? '#16A34A' : '#DC2626',
      color: 'white', fontSize: '13px', fontWeight: '600',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      display: 'flex', alignItems: 'center', gap: '8px',
      animation: 'ciSlideUp 0.3s ease',
    }}>
      {type === 'success' ? <CheckCircle size={15}/> : <AlertCircle size={15}/>}
      {msg}
    </div>
  );
}

// ── Camera QR Scanner (using html5-qrcode) ────────────────────────────────────
const SCANNER_ID = 'ci-qr-reader';

function CameraScanner({ onScan, paused }) {
  const scannerRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
    scannerRef.current = scanner;

    scanner.start(
      { facingMode: 'environment' },
      {
        fps: 12,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
        disableFlip: false,
      },
      (decodedText) => {
        if (!paused) onScan(decodedText);
      },
      () => { /* scan failure — ignore */ }
    ).catch((err) => {
      console.warn('[CameraScanner] start error:', err);
    });

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []); // eslint-disable-line

  return (
    <div style={{ position: 'relative' }}>
      {/* html5-qrcode mounts the video inside this div */}
      <div id={SCANNER_ID} style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }} />

      {/* Overlay corners */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {[
          { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
        ].map((s, i) => (
          <div key={i} style={{
            position: 'absolute', ...s,
            width: '180px', height: '180px',
          }}>
            {/* Four corner brackets */}
            {[
              { top: 0, left: 0, borderTop: '3px solid var(--primary)', borderLeft: '3px solid var(--primary)', borderRadius: '4px 0 0 0' },
              { top: 0, right: 0, borderTop: '3px solid var(--primary)', borderRight: '3px solid var(--primary)', borderRadius: '0 4px 0 0' },
              { bottom: 0, left: 0, borderBottom: '3px solid var(--primary)', borderLeft: '3px solid var(--primary)', borderRadius: '0 0 0 4px' },
              { bottom: 0, right: 0, borderBottom: '3px solid var(--primary)', borderRight: '3px solid var(--primary)', borderRadius: '0 0 4px 0' },
            ].map((cs, ci) => (
              <div key={ci} style={{ position: 'absolute', width: '24px', height: '24px', ...cs }} />
            ))}
            {/* Scan line */}
            <div style={{
              position: 'absolute', top: '50%', left: 0, right: 0, height: '2px',
              background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
              animation: 'ciScanLine 1.8s ease-in-out infinite',
            }} />
          </div>
        ))}
      </div>

      {/* Paused overlay */}
      {paused && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          borderRadius: '12px', gap: '8px', color: 'white',
        }}>
          <CameraOff size={32} />
          <span style={{ fontSize: '13px', fontWeight: '600' }}>Camera tạm dừng</span>
        </div>
      )}
    </div>
  );
}

// ── Ticket result card ────────────────────────────────────────────────────────
function TicketResultCard({ result }) {
  if (!result) return null;

  const { success, ticket, error, errorType, verifiedAt } = result;
  const booking = ticket?.booking || {};
  const trip    = ticket?.trip    || {};
  const seat    = ticket?.seat    || {};

  const borderColor = success ? '#16A34A' : '#DC2626';
  const bgColor     = success ? '#F0FDF4' : '#FFF5F5';

  return (
    <div style={{
      borderRadius: '14px', border: `2px solid ${borderColor}`,
      background: bgColor, padding: '16px',
      animation: 'ciSlideUp 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
          background: success ? '#DCFCE7' : '#FEE2E2',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {success
            ? <CheckCircle size={24} color="#16A34A" />
            : <X size={24} color="#DC2626" />
          }
        </div>
        <div>
          <div style={{ fontWeight: '800', fontSize: '15px', color: success ? '#15803D' : '#DC2626' }}>
            {success ? '✓ Check-in thành công!' : '✗ Vé không hợp lệ'}
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280' }}>
            {verifiedAt || fmtNow()}
          </div>
        </div>
      </div>

      {success ? (
        /* Success detail */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Ticket code */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', background: 'white', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
            <span style={{ fontFamily: 'monospace', fontWeight: '900', fontSize: '18px', letterSpacing: '2px', color: '#15803D' }}>
              {ticket.code || '—'}
            </span>
          </div>
          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <InfoChip icon={<User size={11}/>}  label="Khách"  value={booking?.passengerName || '—'} />
            <InfoChip icon={<Phone size={11}/>} label="SĐT"    value={booking?.passengerPhone || '—'} />
            <InfoChip icon={<Hash size={11}/>}  label="Ghế"    value={seat?.seat?.seatNumber || '—'} bold accent />
            <InfoChip icon={<Ticket size={11}/>} label="Loại"  value={seat?.seat?.seatType || 'Tiêu chuẩn'} />
          </div>
          {/* Trip info */}
          {trip?.fromStation && (
            <div style={{ padding: '8px 10px', background: 'white', borderRadius: '8px', border: '1px solid #BBF7D0', fontSize: '12px' }}>
              <div style={{ fontWeight: '700', marginBottom: '3px', display: 'flex', gap: '6px', alignItems: 'center', color: '#15803D' }}>
                <MapPin size={11}/> {trip.fromStation?.city} → {trip.toStation?.city}
              </div>
              <div style={{ color: '#6B7280' }}>
                <Clock size={10}/> {fmtTime(trip.departureTime)} · {fmtDate(trip.departureTime)}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Error detail */
        <div style={{ fontSize: '13px', color: '#DC2626', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={14}/>
          {error || 'Vé không hợp lệ hoặc đã sử dụng'}
          {errorType === 'used' && (
            <span style={{ fontWeight: '400', color: '#6B7280', fontSize: '12px' }}>
              (Đã check-in trước đó)
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function InfoChip({ icon, label, value, bold, accent }) {
  return (
    <div style={{ background: 'white', borderRadius: '8px', padding: '6px 8px', border: '1px solid #BBF7D0' }}>
      <div style={{ fontSize: '10px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '3px', marginBottom: '1px' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: '12px', fontWeight: bold ? '800' : '600', color: accent ? '#15803D' : '#1F2937', fontFamily: bold ? 'monospace' : 'inherit' }}>
        {value}
      </div>
    </div>
  );
}

// ── History row ───────────────────────────────────────────────────────────────
function HistoryRow({ item, index }) {
  const { ticket, success, verifiedAt } = item;
  return (
    <tr style={{ background: index === 0 ? 'rgba(22,163,74,0.04)' : 'white' }}>
      <td>
        <span style={{
          fontFamily: 'monospace', fontSize: '12px', fontWeight: '700',
          color: success ? 'var(--primary)' : '#DC2626',
          padding: '2px 7px', borderRadius: '5px',
          background: success ? 'var(--primary-bg)' : '#FEE2E2',
        }}>
          {ticket?.code || '—'}
        </span>
      </td>
      <td style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
        {ticket?.booking?.passengerName || '—'}
      </td>
      <td>
        <span style={{ background: 'var(--gray-100)', padding: '2px 8px', borderRadius: '5px', fontWeight: '700', fontFamily: 'monospace', fontSize: '11px' }}>
          {ticket?.seat?.seat?.seatNumber || '—'}
        </span>
      </td>
      <td style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
        {ticket?.trip?.fromStation?.city && ticket?.trip?.toStation?.city
          ? `${ticket.trip.fromStation.city} → ${ticket.trip.toStation.city}`
          : '—'}
      </td>
      <td style={{ fontSize: '11px', color: 'var(--gray-400)' }}>{verifiedAt}</td>
      <td>
        <span style={{
          fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '20px',
          background: success ? '#DCFCE7' : '#FEE2E2',
          color: success ? '#15803D' : '#DC2626',
        }}>
          {success ? '✓ Hợp lệ' : '✗ Lỗi'}
        </span>
      </td>
    </tr>
  );
}

// ── Main CheckInPage ──────────────────────────────────────────────────────────
export default function CheckInPage() {
  // Camera mode vs manual mode
  const [mode, setMode]             = useState('manual'); // 'camera' | 'manual'
  const [cameraPaused, setCameraPaused] = useState(false);
  const [cameraKey, setCameraKey]   = useState(0); // remount camera to restart

  // Manual input
  const [manualCode, setManualCode] = useState('');
  const manualInputRef = useRef(null);

  // Verification state
  const [verifying, setVerifying]   = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [scanCooldown, setScanCooldown] = useState(false); // prevent double-scan
  const cooldownRef = useRef(null);

  // Session history
  const [history, setHistory]       = useState([]);
  const [search,  setSearch]        = useState('');

  // Toast
  const [toast, setToast]           = useState(null);
  const showToast = (msg, type = 'success') => setToast({ msg, type });

  // Stats
  const successCount = history.filter(h => h.success).length;
  const errorCount   = history.filter(h => !h.success).length;

  // ── Core verify function ──────────────────────────────────────────────────
  const verifyCode = useCallback(async (rawValue) => {
    if (verifying || scanCooldown) return;
    const trimmed = rawValue?.trim();
    if (!trimmed) return;

    setVerifying(true);
    setScanCooldown(true);

    const { code, ticketId } = parseQrContent(trimmed);
    const payload = ticketId ? { ticketId } : { code: code || trimmed };

    try {
      const { data } = await api.post('/tickets/verify', payload);
      const ticket = data.ticket;
      const result = {
        success: true,
        ticket,
        verifiedAt: fmtNow(),
      };
      setLastResult(result);
      setHistory(prev => [result, ...prev]);
      beepSuccess();
      showToast(`Check-in: ${ticket?.booking?.passengerName || ticket?.code} ✓`);
      // Auto-pause camera after successful scan so staff can review
      if (mode === 'camera') setCameraPaused(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Vé không hợp lệ';
      const isUsed = msg.toLowerCase().includes('used') || msg.toLowerCase().includes('đã');
      const result = {
        success: false,
        ticket: err.response?.data?.ticket || null, // backend may return ticket on used error
        error: msg,
        errorType: isUsed ? 'used' : 'invalid',
        verifiedAt: fmtNow(),
      };
      setLastResult(result);
      setHistory(prev => [result, ...prev]);
      beepError();
      showToast(msg, 'error');
    } finally {
      setVerifying(false);
      setManualCode('');
      // Cooldown 1.5s to prevent duplicate scans
      cooldownRef.current = setTimeout(() => setScanCooldown(false), 1500);
    }
  }, [verifying, scanCooldown, mode]);

  // ── Camera scan callback ──────────────────────────────────────────────────
  const handleCameraScan = useCallback((decodedText) => {
    if (cameraPaused || scanCooldown) return;
    verifyCode(decodedText);
  }, [cameraPaused, scanCooldown, verifyCode]);

  // ── Manual submit ─────────────────────────────────────────────────────────
  const handleManualSubmit = (e) => {
    e?.preventDefault();
    verifyCode(manualCode);
  };

  // ── Restart scanning after result review ──────────────────────────────────
  const handleNextScan = () => {
    setLastResult(null);
    setCameraPaused(false);
    setScanCooldown(false);
    clearTimeout(cooldownRef.current);
    if (mode === 'manual') {
      setTimeout(() => manualInputRef.current?.focus(), 50);
    }
  };

  // ── Camera restart (re-mount component) ──────────────────────────────────
  const handleRestartCamera = () => {
    setCameraKey(k => k + 1);
    setCameraPaused(false);
    setLastResult(null);
  };

  // ── Auto-focus manual input ───────────────────────────────────────────────
  useEffect(() => {
    if (mode === 'manual') setTimeout(() => manualInputRef.current?.focus(), 100);
  }, [mode]);

  // Cleanup cooldown on unmount
  useEffect(() => () => clearTimeout(cooldownRef.current), []);

  // ── Filtered history ──────────────────────────────────────────────────────
  const filteredHistory = history.filter(h => {
    const q = search.toLowerCase();
    return !q
      || h.ticket?.code?.toLowerCase().includes(q)
      || h.ticket?.booking?.passengerName?.toLowerCase().includes(q)
      || h.ticket?.booking?.passengerPhone?.includes(q)
      || h.ticket?.trip?.fromStation?.city?.toLowerCase().includes(q)
      || h.ticket?.trip?.toStation?.city?.toLowerCase().includes(q);
  });

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Check-in hành khách</h1>
          <p className="section-subtitle">Scan QR hoặc nhập mã để xác nhận lên xe</p>
        </div>
        {/* Session stats */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ padding: '8px 14px', borderRadius: '10px', background: '#DCFCE7', fontSize: '13px', fontWeight: '700', color: '#15803D', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={14}/> {successCount} thành công
          </div>
          {errorCount > 0 && (
            <div style={{ padding: '8px 14px', borderRadius: '10px', background: '#FEE2E2', fontSize: '13px', fontWeight: '700', color: '#DC2626', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <X size={14}/> {errorCount} lỗi
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* ── Left: Scanner panel ─────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Mode toggle */}
          <div style={{ display: 'flex', background: 'var(--gray-200)', borderRadius: '12px', padding: '4px' }}>
            {[
              { id: 'camera', label: 'Camera', icon: <Camera size={14}/> },
              { id: 'manual', label: 'Nhập thủ công', icon: <QrCode size={14}/> },
            ].map(tab => (
              <button key={tab.id} onClick={() => { setMode(tab.id); setLastResult(null); }}
                style={{
                  flex: 1, padding: '9px 12px', borderRadius: '9px', border: 'none',
                  background: mode === tab.id ? 'white' : 'transparent',
                  fontWeight: '600', fontSize: '13px', cursor: 'pointer',
                  color: mode === tab.id ? 'var(--gray-900)' : 'var(--gray-500)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: mode === tab.id ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Camera scanner */}
          {mode === 'camera' && (
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gray-700)' }}>
                  {cameraPaused ? '⏸ Camera tạm dừng' : '🔴 Đang quét...'}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={handleRestartCamera} className="btn btn-ghost btn-sm">
                    <RotateCcw size={13}/> Khởi động lại
                  </button>
                </div>
              </div>

              {/* Camera mount */}
              <div key={cameraKey}>
                <CameraScanner onScan={handleCameraScan} paused={cameraPaused} />
              </div>

              <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: 'var(--gray-400)' }}>
                Đưa mã QR vào khung camera để scan tự động
              </div>

              {/* Next scan button */}
              {cameraPaused && lastResult && (
                <button className="btn btn-primary" onClick={handleNextScan}
                  style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                  <Camera size={15}/> Scan vé tiếp theo
                </button>
              )}
            </div>
          )}

          {/* Manual input */}
          {mode === 'manual' && (
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--gray-700)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <QrCode size={14}/> Nhập mã vé
                </div>

                {/* Visual hint */}
                <div style={{
                  width: '120px', height: '120px', margin: '0 auto 16px',
                  borderRadius: '12px', background: 'var(--primary-bg)',
                  border: '3px dashed var(--primary)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  animation: 'pulse 2s ease infinite',
                }}>
                  <QrCode size={48} color="var(--primary)" />
                  <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: '600' }}>Nhập bên dưới</span>
                </div>
              </div>

              <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  ref={manualInputRef}
                  className="form-input"
                  placeholder="VXB-A3F9K2 hoặc JSON từ QR scanner ngoài..."
                  value={manualCode}
                  onChange={e => setManualCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                  style={{
                    fontFamily: 'monospace', fontSize: '14px', letterSpacing: '1px',
                    textAlign: 'center', fontWeight: '700',
                  }}
                  autoComplete="off"
                  spellCheck="false"
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={verifying || !manualCode.trim()}
                  style={{ justifyContent: 'center', padding: '12px 0', fontSize: '14px' }}
                >
                  {verifying
                    ? <><Loader size={15} style={{ animation: 'ciSpin 1s linear infinite' }}/> Đang xác thực...</>
                    : <><CheckCircle size={15}/> Xác nhận Check-in</>
                  }
                </button>
              </form>

              {/* Manual mode: scan next */}
              {lastResult && (
                <button className="btn btn-ghost" onClick={handleNextScan}
                  style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}>
                  <RotateCcw size={14}/> Scan vé tiếp theo
                </button>
              )}
            </div>
          )}

          {/* Result card */}
          {lastResult && (
            <TicketResultCard result={lastResult} />
          )}

          {/* Session stats mini card */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--gray-600)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Phiên check-in hôm nay
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
              {[
                { label: 'Tổng scan', value: history.length, color: 'var(--gray-800)' },
                { label: 'Hợp lệ', value: successCount, color: '#15803D' },
                { label: 'Lỗi', value: errorCount, color: '#DC2626' },
              ].map(s => (
                <div key={s.label} style={{ padding: '8px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '10px', color: 'var(--gray-400)', fontWeight: '600' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: History table ─────────────────────────────────────── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            padding: '14px 20px', borderBottom: '1px solid var(--gray-100)',
            display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--gray-50)',
          }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--gray-800)', flexShrink: 0 }}>
              Lịch sử check-in ({history.length})
            </div>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}/>
              <input
                className="form-input"
                placeholder="Tìm mã vé, tên khách, tuyến..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '32px', padding: '7px 10px 7px 32px', fontSize: '12px' }}
              />
            </div>
            {history.length > 0 && (
              <button onClick={() => { setHistory([]); setLastResult(null); }}
                className="btn btn-ghost btn-sm" style={{ flexShrink: 0, color: '#DC2626' }}>
                <RotateCcw size={12}/> Reset
              </button>
            )}
          </div>

          {/* Table */}
          <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, maxHeight: 'calc(100vh - 240px)', overflow: 'auto' }}>
            <table>
              <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <tr>
                  <th>Mã vé</th>
                  <th>Hành khách</th>
                  <th>Ghế</th>
                  <th>Tuyến</th>
                  <th>Giờ scan</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--gray-400)' }}>
                      <div style={{ marginBottom: '8px', fontSize: '2rem' }}>📋</div>
                      <div style={{ fontWeight: '600' }}>
                        {search ? 'Không tìm thấy kết quả' : 'Chưa có lượt check-in nào'}
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>
                        {search ? 'Thử tìm với từ khóa khác' : 'Scan QR hoặc nhập mã vé để bắt đầu'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item, i) => (
                    <HistoryRow key={i} item={item} index={i} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes ciSlideUp  { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: none; } }
        @keyframes ciSpin     { to { transform: rotate(360deg); } }
        @keyframes ciScanLine { 0%,100% { transform: translateY(-50px); opacity:0.4; } 50% { transform: translateY(50px); opacity:1; } }
      `}</style>
    </div>
  );
}
