/**
 * pages/customer/PaymentResultPage.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Trang hiển thị kết quả sau khi VNPay redirect người dùng về.
 *
 * Luồng:
 *   1. VNPay redirect → /payment/result?status=success&bookingId=...&txnRef=...
 *   2. Trang này polling GET /api/payment/status/:bookingId để chờ IPN cập nhật DB
 *   3. Khi DB cập nhật → hiển thị vé + QR
 *   4. Nếu thất bại/hủy → hiển thị thông báo lỗi
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, Loader, Ticket,
  Home, RefreshCw, QrCode, AlertTriangle,
} from 'lucide-react';
import api from '../../api/axios';

// Tối đa 12 lần polling, mỗi lần cách nhau 1.5s → chờ tối đa 18s
const MAX_POLL_ATTEMPTS = 12;
const POLL_INTERVAL_MS  = 1500;

export default function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Lấy tham số từ query string do VNPay/backend gửi về
  const status    = searchParams.get('status');    // 'success' | 'failed' | 'invalid'
  const bookingId = searchParams.get('bookingId');
  const txnRef    = searchParams.get('txnRef');
  const rawMsg    = searchParams.get('message');   // encoded URI string

  const errorMessage = rawMsg ? decodeURIComponent(rawMsg) : '';

  // ── State ────────────────────────────────────────────────────────────────────
  const [paymentData, setPaymentData] = useState(null);  // dữ liệu từ /payment/status
  const [polling, setPolling]         = useState(status === 'success' && !!bookingId);
  const [pollCount, setPollCount]     = useState(0);
  const [pollError, setPollError]     = useState('');

  // ── Polling /api/payment/status/:bookingId ───────────────────────────────────
  const checkStatus = useCallback(async (attempt) => {
    try {
      const res  = await api.get(`/payment/status/${bookingId}`);
      const data = res.data;

      // IPN đã cập nhật → hiển thị kết quả ngay
      if (data.paymentStatus === 'paid') {
        setPaymentData(data);
        setPolling(false);
        return;
      }

      // Chưa cập nhật → thử lại nếu còn lượt
      if (attempt < MAX_POLL_ATTEMPTS) {
        setPollCount(attempt + 1);
        setTimeout(() => checkStatus(attempt + 1), POLL_INTERVAL_MS);
      } else {
        // Hết lượt polling — có thể IPN delay, nhắc user kiểm tra lại
        setPollError(
          'Thanh toán đang được xử lý. Vui lòng đợi vài giây rồi kiểm tra lại trong mục "Vé của tôi".'
        );
        setPolling(false);
      }
    } catch (err) {
      setPollError(
        err.response?.data?.message || 'Không thể lấy thông tin thanh toán. Vui lòng liên hệ hỗ trợ.'
      );
      setPolling(false);
    }
  }, [bookingId]);

  useEffect(() => {
    // Chỉ poll khi status = success và có bookingId
    if (status === 'success' && bookingId) {
      checkStatus(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Màn hình đang polling ────────────────────────────────────────────────────
  if (polling) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '70vh', gap: '20px',
      }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'var(--primary-bg)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Loader size={38} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: '700', fontSize: '16px', color: 'var(--gray-800)', marginBottom: '6px' }}>
            Đang xác nhận thanh toán...
          </p>
          <p style={{ fontSize: '13px', color: 'var(--gray-400)' }}>
            Lần kiểm tra {pollCount + 1}/{MAX_POLL_ATTEMPTS} — Vui lòng không đóng trang này
          </p>
        </div>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: 'var(--primary)', opacity: 0.3,
              animation: `pulse 1.2s ease-in-out ${i * 0.3}s infinite`,
            }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Thanh toán THÀNH CÔNG ────────────────────────────────────────────────────
  if (status === 'success' && paymentData?.paymentStatus === 'paid') {
    const { tickets = [], transactionId, finalPrice } = paymentData;

    return (
      <div style={{ background: 'var(--gray-50)', minHeight: '100vh', padding: '40px 0' }}>
        <div className="container" style={{ maxWidth: '620px' }}>

          {/* Header thành công */}
          <div className="card" style={{ padding: '36px', textAlign: 'center', marginBottom: '16px' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'var(--success-light)', margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle size={42} color="var(--success)" />
            </div>

            <h1 style={{ fontWeight: '900', fontSize: '24px', color: 'var(--success)', marginBottom: '8px' }}>
              Thanh toán thành công!
            </h1>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px' }}>
              {tickets.length} vé đã được tạo và sẵn sàng sử dụng
            </p>

            {/* Thông tin giao dịch */}
            {(transactionId || finalPrice || txnRef) && (
              <div style={{
                display: 'flex', gap: '20px', justifyContent: 'center',
                marginTop: '20px', flexWrap: 'wrap',
              }}>
                {finalPrice && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--gray-400)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Số tiền
                    </div>
                    <div style={{ fontWeight: '800', fontSize: '18px', color: 'var(--primary)' }}>
                      {Number(finalPrice).toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                )}
                {transactionId && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '11px', color: 'var(--gray-400)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Mã GD VNPay
                    </div>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--gray-800)', fontFamily: 'monospace' }}>
                      {transactionId}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Danh sách vé + QR */}
          {tickets.length > 0 && (
            <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
              <h3 style={{ fontWeight: '800', fontSize: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <QrCode size={16} color="var(--primary)" />
                Vé của bạn
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {tickets.map((ticket, idx) => (
                  <div key={ticket._id || idx} style={{
                    display: 'flex', alignItems: 'center', gap: '16px',
                    padding: '16px', borderRadius: '12px',
                    border: '1.5px solid var(--gray-200)',
                    background: 'var(--gray-50)',
                  }}>
                    {/* QR Code */}
                    {ticket.qrCode ? (
                      <img
                        src={ticket.qrCode}
                        alt={`QR vé ${ticket.code}`}
                        style={{
                          width: '90px', height: '90px', borderRadius: '8px',
                          border: '2px solid var(--gray-200)', flexShrink: 0,
                          background: 'white',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '90px', height: '90px', borderRadius: '8px',
                        border: '2px dashed var(--gray-300)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--gray-300)',
                      }}>
                        <QrCode size={32} />
                      </div>
                    )}

                    {/* Thông tin vé */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <Ticket size={14} color="var(--primary)" />
                        <span style={{ fontWeight: '800', fontSize: '16px', fontFamily: 'monospace', color: 'var(--primary)', letterSpacing: '1px' }}>
                          {ticket.code}
                        </span>
                        <span style={{
                          fontSize: '10px', fontWeight: '700', padding: '2px 8px',
                          borderRadius: '20px', background: 'var(--success-light)',
                          color: 'var(--success)',
                        }}>
                          Hợp lệ
                        </span>
                      </div>

                      {/* Số ghế nếu có */}
                      {ticket.seat?.seat?.seatNumber && (
                        <div style={{ fontSize: '13px', color: 'var(--gray-600)', marginBottom: '4px' }}>
                          <span style={{ fontWeight: '600' }}>Ghế:</span>{' '}
                          {ticket.seat.seat.seatNumber}
                          {ticket.seat.seat.type === 'vip' && (
                            <span style={{ marginLeft: '4px', color: 'var(--primary)', fontWeight: '700', fontSize: '11px' }}>VIP</span>
                          )}
                        </div>
                      )}

                      <div style={{ fontSize: '11px', color: 'var(--gray-400)' }}>
                        Xuất vé: {new Date(ticket.createdAt || Date.now()).toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Nút điều hướng */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              id="btn-view-my-tickets"
              className="btn btn-outline w-full"
              style={{ justifyContent: 'center', padding: '14px' }}
              onClick={() => navigate('/my-tickets')}
            >
              <Ticket size={16} />
              Xem tất cả vé
            </button>
            <button
              id="btn-back-home-success"
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center', padding: '14px' }}
              onClick={() => navigate('/')}
            >
              <Home size={16} />
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Polling hết lượt — chưa xác nhận được ───────────────────────────────────
  if (status === 'success' && pollError) {
    return (
      <div style={{ background: 'var(--gray-50)', minHeight: '100vh', padding: '40px 0' }}>
        <div className="container" style={{ maxWidth: '500px' }}>
          <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: '#FEF3C7', margin: '0 auto 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AlertTriangle size={36} color="#D97706" />
            </div>
            <h2 style={{ fontWeight: '900', fontSize: '20px', color: '#D97706', marginBottom: '10px' }}>
              Đang xử lý...
            </h2>
            <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
              {pollError}
            </p>
            {bookingId && (
              <p style={{ fontSize: '12px', color: 'var(--gray-400)', marginBottom: '24px', fontFamily: 'monospace' }}>
                Mã booking: {bookingId}
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                id="btn-check-my-tickets"
                className="btn btn-outline w-full"
                style={{ justifyContent: 'center' }}
                onClick={() => navigate('/my-tickets')}
              >
                <Ticket size={15} /> Kiểm tra vé
              </button>
              <button
                id="btn-back-home-pending"
                className="btn btn-primary w-full"
                style={{ justifyContent: 'center' }}
                onClick={() => navigate('/')}
              >
                <Home size={15} /> Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Thanh toán THẤT BẠI / HỦY / Chữ ký không hợp lệ ───────────────────────
  return (
    <div style={{ background: 'var(--gray-50)', minHeight: '100vh', padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '500px' }}>
        <div className="card" style={{ padding: '36px', textAlign: 'center' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'var(--danger-light)', margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <XCircle size={36} color="var(--danger)" />
          </div>

          <h2 style={{ fontWeight: '900', fontSize: '22px', color: 'var(--danger)', marginBottom: '10px' }}>
            {status === 'invalid' ? 'Giao dịch không hợp lệ' : 'Thanh toán thất bại'}
          </h2>

          <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '16px', lineHeight: '1.6' }}>
            {status === 'invalid'
              ? 'Chữ ký giao dịch không hợp lệ. Vui lòng không thử lại với link này.'
              : errorMessage || 'Giao dịch bị hủy hoặc đã xảy ra lỗi. Tiền chưa bị trừ.'}
          </p>

          {bookingId && (
            <p style={{ fontSize: '12px', color: 'var(--gray-400)', marginBottom: '24px', fontFamily: 'monospace' }}>
              Mã booking: {bookingId}
            </p>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              id="btn-retry-payment"
              className="btn btn-outline w-full"
              style={{ justifyContent: 'center' }}
              onClick={() => navigate(-1)}
            >
              <RefreshCw size={15} /> Thử lại
            </button>
            <button
              id="btn-back-home-failed"
              className="btn btn-primary w-full"
              style={{ justifyContent: 'center' }}
              onClick={() => navigate('/')}
            >
              <Home size={15} /> Về trang chủ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
