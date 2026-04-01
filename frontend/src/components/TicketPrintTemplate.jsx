/**
 * TicketPrintTemplate.jsx
 *
 * Thermal 80mm print template for counter-sale tickets.
 *
 * Usage:
 *   1. Mount <TicketPrintTemplate booking={...} tickets={[...]} /> anywhere in the DOM.
 *      The component is visually hidden at all times (display:none).
 *   2. Call the exported printTickets(booking, tickets) helper to inject data
 *      into #counter-print-area and trigger window.print().
 *
 * @media print rules (in index.css or a global style) handle:
 *   - hiding the entire app
 *   - showing only #counter-print-area
 *   - setting page size to 80mm
 */

import { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import ReactDOM from 'react-dom';

// ── Formatters ────────────────────────────────────────────────────────────────
const fmtTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh',
  }) : '--:--';

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh',
  }) : '';

const fmtMoney = (n) =>
  n != null ? `${Number(n).toLocaleString('vi-VN')}đ` : '0đ';

const fmtPayment = (method) => ({
  counter:       'Tiền mặt',
  bank_transfer: 'Chuyển khoản',
  card:          'Quẹt thẻ',
  cod:           'Tiền mặt',
  online:        'Online',
}[method] || method || 'Tiền mặt');

// ── Divider ───────────────────────────────────────────────────────────────────
const Dashed = () => (
  <div style={{ borderTop: '1px dashed #888', margin: '6px 0' }} />
);

// ── Single ticket slip ────────────────────────────────────────────────────────
function TicketSlip({ ticket, booking, index, total }) {
  const trip        = booking?.trip  || {};
  const bus         = trip.bus       || {};
  const company     = trip.busCompany || {};
  const from        = trip.fromStation || {};
  const to          = trip.toStation   || {};
  const seatNumber  = ticket.seat?.seat?.seatNumber || ticket.seat?.seatNumber || '?';
  const qrValue     = ticket.code || ticket._id || 'N/A';
  const ticketCode  = ticket.code || (ticket._id?.slice(-8)?.toUpperCase() || '');

  const printedAt = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

  return (
    <div style={{
      width: '72mm',          /* ~80mm paper minus margins */
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '11pt',
      color: '#000',
      pageBreakAfter: index < total - 1 ? 'always' : 'avoid',
      padding: '0',
    }}>

      {/* ── Header: company logo + name ─────────────────────────────── */}
      <div style={{ textAlign: 'center', marginBottom: '6px' }}>
        {company.logo && (
          <img
            src={company.logo}
            alt="logo"
            style={{ width: '40px', height: '40px', objectFit: 'contain', marginBottom: '4px' }}
            crossOrigin="anonymous"
          />
        )}
        <div style={{ fontWeight: 'bold', fontSize: '13pt', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {company.name || 'NHÀ XE'}
        </div>
        {company.shortName && company.shortName !== company.name && (
          <div style={{ fontSize: '9pt', color: '#555' }}>{company.shortName}</div>
        )}
        <div style={{ fontSize: '9pt', color: '#555', marginTop: '2px' }}>
          VÉ XE KHÁCH — BÁN TẠI QUẦY
        </div>
      </div>

      <Dashed />

      {/* ── Ticket code ───────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', margin: '6px 0' }}>
        <div style={{ fontSize: '9pt', color: '#555', marginBottom: '2px' }}>MÃ VÉ</div>
        <div style={{
          fontSize: '18pt', fontWeight: 'bold', letterSpacing: '3px',
          border: '2px solid #000', display: 'inline-block',
          padding: '3px 14px', borderRadius: '4px',
        }}>
          {ticketCode}
        </div>
      </div>

      {/* ── QR Code ───────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', margin: '6px 0' }}>
        <QRCodeSVG
          value={qrValue}
          size={110}
          level="M"
          includeMargin={false}
          style={{ display: 'block', margin: '0 auto' }}
        />
        <div style={{ fontSize: '8pt', color: '#777', marginTop: '3px' }}>
          Scan để check-in lên xe
        </div>
      </div>

      <Dashed />

      {/* ── Khách hàng ───────────────────────────────────────────────── */}
      <Row label="Khách" value={booking?.passengerName || '—'} bold />
      <Row label="SĐT"   value={booking?.passengerPhone || '—'} />
      {booking?.passengerIdCard && (
        <Row label="CCCD"  value={booking.passengerIdCard} />
      )}

      <Dashed />

      {/* ── Hành trình ──────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', margin: '5px 0', fontWeight: 'bold', fontSize: '12pt' }}>
        {from.city || from.name || '?'} → {to.city || to.name || '?'}
      </div>
      <Row label="Ngày"  value={fmtDate(trip.departureTime)} />
      <Row label="Giờ"   value={`${fmtTime(trip.departureTime)} (UTC+7)`} bold />

      <Dashed />

      {/* ── Xe & ghế ────────────────────────────────────────────────── */}
      <Row label="Ghế"    value={seatNumber} bold lg />
      {bus.name        && <Row label="Xe"     value={bus.name} />}
      {bus.licensePlate && <Row label="BSX"    value={bus.licensePlate} bold />}
      {bus.type        && <Row label="Loại"   value={bus.type} />}
      {bus.driver      && <Row label="Tài xế" value={bus.driver} />}

      <Dashed />

      {/* ── Giá vé ──────────────────────────────────────────────────── */}
      <Row label="Giá vé"    value={fmtMoney(trip.price)} bold />
      <Row label="Thanh toán" value={fmtPayment(booking?.paymentMethod)} />

      <Dashed />

      {/* ── Bán vé ──────────────────────────────────────────────────── */}
      <div style={{ fontSize: '9pt', color: '#555', lineHeight: 1.5 }}>
        <div>Bán tại: Quầy nhà xe</div>
        {booking?.soldBy?.username && (
          <div>Nhân viên: {booking.soldBy.username}</div>
        )}
        <div>Lúc: {printedAt}</div>
      </div>

      <Dashed />

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', fontSize: '9pt', color: '#555', lineHeight: 1.6 }}>
        <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Cảm ơn quý khách!</div>
        <div>Vui lòng có mặt trước giờ xuất bến 15 phút.</div>
        <div>Không hoàn vé trong vòng 2 giờ trước giờ chạy.</div>
        {total > 1 && (
          <div style={{ marginTop: '4px', fontWeight: 'bold' }}>
            Vé {index + 1}/{total}
          </div>
        )}
      </div>

    </div>
  );
}

// ── Row helper ────────────────────────────────────────────────────────────────
function Row({ label, value, bold, lg }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      padding: '2px 0', fontSize: lg ? '12pt' : '10pt',
    }}>
      <span style={{ color: '#555', flexShrink: 0, marginRight: '8px' }}>{label}:</span>
      <span style={{ fontWeight: bold ? 'bold' : 'normal', textAlign: 'right' }}>{value}</span>
    </div>
  );
}

// ── Portal-based print template ───────────────────────────────────────────────
/**
 * Mount this component once near the root of your app.
 * It renders a hidden #counter-print-area div that printTickets() populates.
 */
export function PrintPortal() {
  return (
    <div id="counter-print-area" style={{ display: 'none' }} aria-hidden="true" />
  );
}

// ── printTickets() — the public API ──────────────────────────────────────────
/**
 * Call this function to trigger thermal printing.
 *
 * @param {object}   booking  — full booking object (from /api/bookings/counter response)
 * @param {object[]} tickets  — array of ticket objects
 */
export function printTickets(booking, tickets) {
  const printArea = document.getElementById('counter-print-area');
  if (!printArea) {
    console.warn('PrintPortal not mounted. Add <PrintPortal /> near your app root.');
    window.print();
    return;
  }

  // Render ticket slips into the print area
  ReactDOM.render(
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {tickets.map((tkt, i) => (
        <TicketSlip
          key={tkt._id || i}
          ticket={tkt}
          booking={booking}
          index={i}
          total={tickets.length}
        />
      ))}
    </div>,
    printArea
  );

  // Small delay so React has time to flush, then print
  setTimeout(() => window.print(), 150);
}

// ── TicketPrintTemplate (inline version) ─────────────────────────────────────
/**
 * Alternative: Use this component inline (renders nothing to screen).
 * Pass it a ref to get access to the print trigger function.
 *
 * <TicketPrintTemplate ref={printRef} />
 * printRef.current.print(booking, tickets)
 */
import { forwardRef, useImperativeHandle } from 'react';

const TicketPrintTemplate = forwardRef(function TicketPrintTemplate(_, ref) {
  const containerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    print: (booking, tickets) => printTickets(booking, tickets),
  }));

  return null; // renders nothing — uses the global PrintPortal
});

export default TicketPrintTemplate;
