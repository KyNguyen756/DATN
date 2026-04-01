





































































































































































































































































































































































































































































































































































































































































import { useState, useEffect, useCallback } from 'react';
import {
  X, Calendar, CalendarRange, CalendarPlus, Bus,
  AlertCircle, CheckCircle2, Loader, Info,
  AlertTriangle, BusIcon, Ban, Copy,
} from 'lucide-react';
import tripTemplateApi from '../api/tripTemplateApi';
import api from '../api/axios';

/**
 * GenerateTripDialog
 * Props:
 *   template  {object}  TripTemplate object
 *   onClose   {fn}
 *   onSuccess {fn}      Called after any successful generation
 */
export default function GenerateTripDialog({ template, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState('single');
  const [buses, setBuses] = useState([]);
  const [busLoading, setBusLoading] = useState(false);

  // ── Single day form ──────────────────────────────────────────────────────
  const [singleForm, setSingleForm] = useState({
    targetDate: today(),
    bus: template.bus?._id || template.bus || '',
    price: String(template.price || ''),
    departureTime: '',
  });

  // ── Bulk range form ──────────────────────────────────────────────────────
  const [rangeForm, setRangeForm] = useState({
    fromDate: today(),
    toDate: addDays(today(), 6),
    bus: template.bus?._id || template.bus || '',
    price: String(template.price || ''),
  });

  // ── Shared state ─────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState({ msg: '', type: 'generic' }); // type: generic|duplicate|inactive|no_bus|no_seats
  const [result, setResult] = useState(null);

  // Load buses
  useEffect(() => {
    setBusLoading(true);
    api.get('/buses', { params: { limit: 100 } })
      .then(({ data }) => setBuses(data.buses || data || []))
      .catch(() => { })
      .finally(() => setBusLoading(false));
  }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmtHM = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

  const predictedDays = useCallback(() => {
    if (activeTab !== 'range') return 0;
    const from = new Date(rangeForm.fromDate);
    const to = new Date(rangeForm.toDate);
    if (isNaN(from) || isNaN(to) || from > to) return 0;
    let count = 0;
    const cur = new Date(from);
    while (cur <= to) {
      const dow = cur.getUTCDay();
      if (!template.daysOfWeek?.length || template.daysOfWeek.includes(dow)) count++;
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return count;
  }, [rangeForm.fromDate, rangeForm.toDate, template.daysOfWeek, activeTab]);

  // ── Parse error from API response into categorized type ──────────────────
  const parseError = (e) => {
    const msg = e.response?.data?.message || e.message || '';
    const lower = msg.toLowerCase();

    if (lower.includes('đã tồn tại') || lower.includes('duplicate') || lower.includes('already exist')) {
      return { msg, type: 'duplicate' };
    }
    if (lower.includes('inactive') || lower.includes('không hoạt động') || lower.includes('tạm dừng')) {
      return { msg: msg || 'Template đang tạm dừng, không thể tạo chuyến.', type: 'inactive' };
    }
    if (lower.includes('xe') && (lower.includes('không tìm thấy') || lower.includes('không có') || lower.includes('bus'))) {
      return { msg: msg || 'Không tìm thấy xe phù hợp. Vui lòng chọn xe để override.', type: 'no_bus' };
    }
    if (lower.includes('ghế') || lower.includes('seat')) {
      return { msg: msg || 'Không thể tạo ghế cho chuyến này.', type: 'no_seats' };
    }
    if (lower.includes('quyền') || lower.includes('forbidden') || lower.includes('unauthorized')) {
      return { msg: msg || 'Bạn không có quyền tạo chuyến cho công ty này.', type: 'permission' };
    }
    return { msg: msg || 'Tạo chuyến thất bại. Vui lòng thử lại.', type: 'generic' };
  };

  const clearError = () => setError({ msg: '', type: 'generic' });

  // ── Submit single ─────────────────────────────────────────────────────────
  const handleSingle = async () => {
    if (!singleForm.targetDate) { setError({ msg: 'Chọn ngày tạo chuyến', type: 'generic' }); return; }
    clearError(); setSaving(true); setResult(null);
    try {
      const body = {
        targetDate: singleForm.targetDate,
        bus: singleForm.bus || undefined,
        price: singleForm.price ? Number(singleForm.price) : undefined,
        departureTime: singleForm.departureTime
          ? new Date(`${singleForm.targetDate}T${singleForm.departureTime}:00`).toISOString()
          : undefined,
      };
      const { data } = await tripTemplateApi.generate(template._id, body);
      setResult({
        type: 'single',
        message: `✅ Đã tạo chuyến thành công!${data.seatsCreated ? ` ${data.seatsCreated} ghế được tạo.` : ''}`,
        tripId: data.trip?._id,
      });
      onSuccess?.();
    } catch (e) {
      setError(parseError(e));
    } finally {
      setSaving(false);
    }
  };

  // ── Submit bulk ───────────────────────────────────────────────────────────
  const handleBulk = async () => {
    if (!rangeForm.fromDate || !rangeForm.toDate) { setError({ msg: 'Chọn khoảng ngày', type: 'generic' }); return; }
    if (new Date(rangeForm.fromDate) > new Date(rangeForm.toDate)) { setError({ msg: 'Ngày bắt đầu phải trước ngày kết thúc', type: 'generic' }); return; }
    clearError(); setSaving(true); setResult(null);
    try {
      const body = {
        fromDate: rangeForm.fromDate,
        toDate: rangeForm.toDate,
        bus: rangeForm.bus || undefined,
        price: rangeForm.price ? Number(rangeForm.price) : undefined,
      };
      const { data } = await tripTemplateApi.bulkGenerate(template._id, body);
      const created = data.summary?.createdCount ?? 0;
      const skipped = data.summary?.skippedCount ?? 0;
      const errors = data.summary?.errorCount ?? 0;
      setResult({ type: 'bulk', created, skipped, errors, trips: data.created || [] });
      onSuccess?.();
    } catch (e) {
      setError(parseError(e));
    } finally {
      setSaving(false);
    }
  };

  // ── Error UI config per type ──────────────────────────────────────────────
  const ERROR_CFG = {
    duplicate: { icon: <Copy size={15} />, bg: '#FFFBEB', border: '#FDE68A', text: '#92400E', hint: 'Chuyến đã tồn tại vào ngày này. Bỏ qua là bình thường trong bulk generate.' },
    inactive: { icon: <Ban size={15} />, bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', hint: 'Chuyển template về trạng thái "Hoạt động" trước khi tạo chuyến.' },
    no_bus: { icon: <BusIcon size={15} />, bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', hint: 'Chọn xe override ở bên dưới hoặc cập nhật xe mặc định trong template.' },
    no_seats: { icon: <AlertTriangle size={15} />, bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', hint: 'Xe được chọn có thể chưa có cấu hình ghế. Kiểm tra lại trang Xe.' },
    permission: { icon: <AlertCircle size={15} />, bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', hint: 'Liên hệ admin để được cấp quyền quản lý chuyến của công ty này.' },
    generic: { icon: <AlertCircle size={15} />, bg: '#FEF2F2', border: '#FECACA', text: '#DC2626', hint: '' },
  };

  const errCfg = ERROR_CFG[error.type] || ERROR_CFG.generic;

  // ── Styles ────────────────────────────────────────────────────────────────
  const TAB_STYLE = (active) => ({
    display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 16px',
    borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent',
    color: active ? 'var(--primary)' : 'var(--gray-500)',
    fontWeight: active ? '700' : '500', fontSize: '13px',
    background: 'none', border: 'none', cursor: 'pointer',
    transition: 'color 0.2s',
  });
  const inputStyle = { width: '100%', padding: '9px 12px', border: '1px solid var(--gray-200)', borderRadius: '8px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { fontSize: '12px', fontWeight: '700', color: 'var(--gray-600)', marginBottom: '5px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{ background: 'white', borderRadius: '16px', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255,107,53,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarPlus size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--gray-900)' }}>Tạo chuyến từ template</div>
              <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{template.name}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--gray-200)', background: 'white', cursor: 'pointer', display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        {/* Template info strip */}
        <div style={{ padding: '10px 24px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)', display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { label: 'Tuyến', value: `${template.fromStation?.city} → ${template.toStation?.city}` },
            { label: 'Giờ mặc định', value: fmtHM(template.departureHour, template.departureMinute) },
            { label: 'Giá mặc định', value: `${Number(template.price).toLocaleString('vi-VN')}đ` },
            { label: 'Xe mặc định', value: template.bus?.name || 'chưa chọn' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: '10px', color: 'var(--gray-400)', fontWeight: '600', textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-800)' }}>{value}</div>
            </div>
          ))}
          {/* Template status badge */}
          <div style={{ marginLeft: 'auto' }}>
            <span style={{
              padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
              background: template.status === 'active' ? '#DCFCE7' : '#F3F4F6',
              color: template.status === 'active' ? '#16A34A' : '#6B7280',
            }}>
              {template.status === 'active' ? '● Hoạt động' : '● Tạm dừng'}
            </span>
          </div>
        </div>

        {/* Inactive warning banner */}
        {template.status !== 'active' && (
          <div style={{ padding: '10px 24px', background: '#FFFBEB', borderBottom: '1px solid #FDE68A', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#92400E' }}>
            <AlertTriangle size={14} />
            <span><strong>Template đang tạm dừng.</strong> Cập nhật trạng thái về "Hoạt động" trước khi tạo chuyến.</span>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--gray-100)', padding: '0 20px' }}>
          <button style={TAB_STYLE(activeTab === 'single')} onClick={() => { setActiveTab('single'); clearError(); setResult(null); }}>
            <Calendar size={14} /> Tạo 1 ngày
          </button>
          <button style={TAB_STYLE(activeTab === 'range')} onClick={() => { setActiveTab('range'); clearError(); setResult(null); }}>
            <CalendarRange size={14} /> Tạo nhiều ngày
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {/* Result banner */}
          {result && (
            <div style={{ marginBottom: '16px', padding: '14px 16px', borderRadius: '10px', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
              {result.type === 'single' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16A34A', fontWeight: '600', fontSize: '13px' }}>
                  <CheckCircle2 size={16} /> {result.message}
                </div>
              ) : (
                <div style={{ color: '#16A34A', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', marginBottom: '6px' }}>
                    <CheckCircle2 size={16} /> Bulk generate hoàn thành
                  </div>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span>✅ Đã tạo: <strong>{result.created}</strong></span>
                    <span style={{ color: '#CA8A04' }}>⏩ Bỏ qua (trùng): <strong>{result.skipped}</strong></span>
                    {result.errors > 0 && <span style={{ color: '#DC2626' }}>❌ Lỗi: <strong>{result.errors}</strong></span>}
                  </div>
                  {result.errors > 0 && (
                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#DC2626', background: '#FEF2F2', padding: '6px 10px', borderRadius: '6px' }}>
                      ⚠️ Một số chuyến không tạo được — thường do xe không có ghế hoặc trùng lịch. Kiểm tra lại trang Xe.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error banner — categorized */}
          {error.msg && (
            <div style={{
              marginBottom: '16px', padding: '12px 16px', borderRadius: '8px',
              background: errCfg.bg, border: `1px solid ${errCfg.border}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: errCfg.text, fontSize: '13px', fontWeight: '600' }}>
                {errCfg.icon} {error.msg}
                <button onClick={clearError} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: errCfg.text, padding: '2px', display: 'flex' }}>
                  <X size={13} />
                </button>
              </div>
              {errCfg.hint && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: errCfg.text, opacity: 0.8, paddingLeft: '23px' }}>
                  💡 {errCfg.hint}
                </div>
              )}
            </div>
          )}

          {/* ── SINGLE DAY TAB ──────────────────────────────────────────── */}
          {activeTab === 'single' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={labelStyle}>Ngày tạo chuyến *</label>
                <input type="date" style={inputStyle} value={singleForm.targetDate}
                  min={today()}
                  onChange={e => setSingleForm(f => ({ ...f, targetDate: e.target.value }))} />
              </div>

              {/* Preview */}
              {singleForm.targetDate && (
                <div style={{ background: '#EFF6FF', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Info size={15} style={{ color: '#2563EB', flexShrink: 0, marginTop: '1px' }} />
                  <div style={{ fontSize: '12px', color: '#1D4ED8' }}>
                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>Xem trước chuyến sẽ tạo</div>
                    <div>📅 Ngày chạy: <strong>{formatDate(singleForm.targetDate)}</strong></div>
                    <div>🕐 Giờ xuất phát: <strong>
                      {singleForm.departureTime || fmtHM(template.departureHour, template.departureMinute)}
                    </strong> <span style={{ fontSize: '10px', opacity: 0.7 }}>(UTC+7)</span></div>
                    <div>💰 Giá: <strong>{(Number(singleForm.price) || template.price).toLocaleString('vi-VN')}đ</strong></div>
                    <div>🚌 Xe: <strong>{
                      buses.find(b => b._id === singleForm.bus)?.name ||
                      template.bus?.name || '(chưa chọn)'
                    }</strong></div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Override giờ xuất phát (tùy chọn)</label>
                  <input type="time" style={inputStyle} value={singleForm.departureTime}
                    onChange={e => setSingleForm(f => ({ ...f, departureTime: e.target.value }))} />
                  <div style={{ fontSize: '11px', color: 'var(--gray-400)', marginTop: '3px' }}>Để trống = dùng giờ mặc định</div>
                </div>
                <div>
                  <label style={labelStyle}>Override giá vé (tùy chọn)</label>
                  <input type="number" style={inputStyle} value={singleForm.price}
                    onChange={e => setSingleForm(f => ({ ...f, price: e.target.value }))}
                    placeholder={template.price} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Override xe (tùy chọn)
                  {busLoading && <span style={{ fontWeight: 400, marginLeft: 6, color: 'var(--gray-400)' }}>đang tải...</span>}
                </label>
                <select style={{ ...inputStyle, cursor: 'pointer' }} value={singleForm.bus}
                  onChange={e => setSingleForm(f => ({ ...f, bus: e.target.value }))}>
                  <option value="">— Dùng xe mặc định ({template.bus?.name || 'chưa chọn'}) —</option>
                  {buses.map(b => <option key={b._id} value={b._id}>{b.licensePlate} — {b.name} ({b.totalSeats} chỗ)</option>)}
                </select>
              </div>
            </div>
          )}

          {/* ── RANGE TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'range' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Từ ngày *</label>
                  <input type="date" style={inputStyle} value={rangeForm.fromDate}
                    min={today()}
                    onChange={e => setRangeForm(f => ({ ...f, fromDate: e.target.value }))} />
                </div>
                <div>
                  <label style={labelStyle}>Đến ngày * (max 30 ngày)</label>
                  <input type="date" style={inputStyle} value={rangeForm.toDate}
                    min={rangeForm.fromDate}
                    onChange={e => setRangeForm(f => ({ ...f, toDate: e.target.value }))} />
                </div>
              </div>

              {/* Range preview */}
              {rangeForm.fromDate && rangeForm.toDate && (
                <div style={{ background: '#EFF6FF', borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <Info size={15} style={{ color: '#2563EB', flexShrink: 0, marginTop: '1px' }} />
                  <div style={{ fontSize: '12px', color: '#1D4ED8' }}>
                    <div style={{ fontWeight: '700', marginBottom: '6px' }}>Dự kiến sẽ tạo</div>
                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                      <span>📅 Số ngày trong range: <strong>{daysBetween(rangeForm.fromDate, rangeForm.toDate) + 1}</strong></span>
                      <span>🎯 Ngày khớp daysOfWeek: <strong>{predictedDays()}</strong> chuyến</span>
                    </div>
                    <div style={{ marginTop: '6px', color: '#3B82F6', fontSize: '11px' }}>
                      {template.daysOfWeek?.length
                        ? `Lọc theo: ${template.daysOfWeek.map(d => ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d]).join(', ')}`
                        : 'Không lọc ngày — tạo tất cả ngày trong range'}
                    </div>
                    <div style={{ marginTop: '4px', fontSize: '11px', color: '#6B7280' }}>
                      🕐 Giờ xuất phát: <strong>{fmtHM(template.departureHour, template.departureMinute)}</strong> (UTC+7) • Chuyến trùng sẽ bị bỏ qua tự động
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Override giá vé (tùy chọn)</label>
                  <input type="number" style={inputStyle} value={rangeForm.price}
                    onChange={e => setRangeForm(f => ({ ...f, price: e.target.value }))}
                    placeholder={template.price} />
                </div>
                <div>
                  <label style={labelStyle}>Override xe (tùy chọn)
                    {busLoading && <span style={{ fontWeight: 400, marginLeft: 6, color: 'var(--gray-400)' }}>đang tải...</span>}
                  </label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={rangeForm.bus}
                    onChange={e => setRangeForm(f => ({ ...f, bus: e.target.value }))}>
                    <option value="">— Dùng xe mặc định —</option>
                    {buses.map(b => <option key={b._id} value={b._id}>{b.licensePlate} — {b.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ background: 'var(--gray-50)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Info size={13} style={{ color: 'var(--gray-400)' }} />
                <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>Chuyến đã tồn tại sẽ bị bỏ qua (không gây lỗi). Tối đa 30 ngày/lần.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', background: 'var(--gray-50)' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid var(--gray-200)', background: 'white', fontWeight: '600', fontSize: '13px', cursor: 'pointer', color: 'var(--gray-700)' }}>
            Đóng
          </button>
          <button
            onClick={activeTab === 'single' ? handleSingle : handleBulk}
            disabled={saving || template.status !== 'active'}
            title={template.status !== 'active' ? 'Template đang tạm dừng' : ''}
            style={{
              padding: '9px 20px', borderRadius: '8px',
              background: (saving || template.status !== 'active') ? 'var(--gray-300)' : 'var(--primary)',
              color: 'white', fontWeight: '700', fontSize: '13px', border: 'none',
              cursor: (saving || template.status !== 'active') ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: '7px',
              transition: 'background 0.2s',
            }}
          >
            {saving
              ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Đang tạo...</>
              : <><CalendarPlus size={14} /> {activeTab === 'single' ? 'Tạo chuyến' : `Tạo ${predictedDays()} chuyến`}</>
            }
          </button>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10);
}
function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function daysBetween(from, to) {
  return Math.ceil((new Date(to) - new Date(from)) / 86400000);
}
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
  });
}
