import { AlertCircle, CheckCircle, Info } from 'lucide-react';

const configs = {
  error:   { icon: AlertCircle,   bg: 'var(--danger-light)',  color: 'var(--danger)' },
  success: { icon: CheckCircle,   bg: 'var(--success-light)', color: 'var(--success)' },
  info:    { icon: Info,          bg: 'var(--info-light)',    color: 'var(--info)' },
  warning: { icon: AlertCircle,   bg: 'var(--warning-light)', color: 'var(--warning)' },
};

/**
 * Inline alert/feedback box.
 *
 * Usage:
 *   <AlertBox type="error" message="Something went wrong" />
 *   <AlertBox type="success" message="Saved!" />
 */
export default function AlertBox({ type = 'error', message }) {
  if (!message) return null;
  const cfg = configs[type] || configs.error;
  const Icon = cfg.icon;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 16px',
      borderRadius: '10px',
      background: cfg.bg,
      color: cfg.color,
      fontSize: '13px',
      fontWeight: '500',
      marginBottom: '16px',
    }}>
      <Icon size={15} style={{ flexShrink: 0 }} />
      <span>{message}</span>
    </div>
  );
}
