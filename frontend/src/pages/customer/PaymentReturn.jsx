import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle, XCircle, AlertTriangle, Loader,
  ArrowLeft, Ticket, Home, RefreshCw
} from 'lucide-react';
import api from '../../api/axios';

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Forward all VNPay query params to backend for verification
        const queryString = searchParams.toString();
        const res = await api.get(`/vnpay/return?${queryString}`);
        setResult(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể xác minh kết quả thanh toán');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, []); // eslint-disable-line

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--gray-50)'
      }}>
        <div className="card" style={{ padding: '48px', textAlign: 'center', maxWidth: '420px' }}>
          <Loader size={40} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)', margin: '0 auto 16px' }} />
          <h3 style={{ fontWeight: '800', fontSize: '18px', marginBottom: '8px' }}>Đang xác minh thanh toán...</h3>
          <p style={{ color: 'var(--gray-500)', fontSize: '13px' }}>Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--gray-50)'
      }}>
        <div className="card" style={{ padding: '48px', textAlign: 'center', maxWidth: '420px' }}>
          <div style={{
            width: '72px', height: '72px', borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)', margin: '0 auto 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <AlertTriangle size={36} color="var(--danger)" />
          </div>
          <h3 style={{ fontWeight: '800', fontSize: '18px', color: 'var(--danger)', marginBottom: '8px' }}>
            Lỗi xác minh
          </h3>
          <p style={{ color: 'var(--gray-500)', fontSize: '13px', marginBottom: '24px' }}>{error}</p>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/')}>
            <Home size={16} /> Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const isSuccess = result?.isValid && result?.responseCode === '00';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--gray-50)', padding: '24px'
    }}>
      <div className="card" style={{ padding: '40px', textAlign: 'center', maxWidth: '520px', width: '100%' }}>

        {/* Icon */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: isSuccess ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          margin: '0 auto 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeIn 0.5s ease'
        }}>
          {isSuccess
            ? <CheckCircle size={40} color="var(--success)" />
            : <XCircle size={40} color="var(--danger)" />
          }
        </div>

        {/* Title */}
        <h2 style={{
          fontWeight: '900', fontSize: '22px',
          color: isSuccess ? 'var(--success)' : 'var(--danger)',
          marginBottom: '8px'
        }}>
          {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
        </h2>

        <p style={{ color: 'var(--gray-500)', fontSize: '14px', marginBottom: '28px' }}>
          {isSuccess
            ? 'Giao dịch của bạn đã được xác nhận. Vé sẽ được tạo tự động.'
            : result?.message || 'Giao dịch không thành công. Vui lòng thử lại.'
          }
        </p>

        {/* Transaction details */}
        <div style={{
          background: 'var(--gray-50)', borderRadius: '14px', padding: '18px',
          marginBottom: '28px', textAlign: 'left'
        }}>
          {[
            ['Mã giao dịch', result?.txnRef || '—'],
            ['Số tiền', result?.amount ? `${result.amount.toLocaleString()}đ` : '—'],
            ['Ngân hàng', result?.bankCode || '—'],
            ['Mã GD VNPAY', result?.transactionNo || '—'],
            ['Trạng thái', isSuccess ? 'Thành công' : `Thất bại (${result?.responseCode || '?'})`],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between" style={{
              padding: '8px 0',
              borderBottom: '1px solid var(--gray-200)',
              fontSize: '13px'
            }}>
              <span style={{ color: 'var(--gray-500)' }}>{k}</span>
              <span style={{
                fontWeight: '700',
                color: k === 'Trạng thái'
                  ? (isSuccess ? 'var(--success)' : 'var(--danger)')
                  : 'var(--gray-800)',
                fontFamily: k === 'Mã giao dịch' || k === 'Mã GD VNPAY' ? 'monospace' : 'inherit'
              }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          {isSuccess ? (
            <>
              <button
                className="btn btn-outline w-full"
                style={{ justifyContent: 'center' }}
                onClick={() => navigate('/my-tickets')}
              >
                <Ticket size={15} /> Xem vé
              </button>
              <button
                className="btn btn-primary w-full"
                style={{ justifyContent: 'center' }}
                onClick={() => navigate('/')}
              >
                <Home size={15} /> Trang chủ
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-outline w-full"
                style={{ justifyContent: 'center' }}
                onClick={() => navigate('/')}
              >
                <ArrowLeft size={15} /> Trang chủ
              </button>
              <button
                className="btn btn-primary w-full"
                style={{ justifyContent: 'center' }}
                onClick={() => navigate('/search')}
              >
                <RefreshCw size={15} /> Đặt lại
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
