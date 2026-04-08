/**
 * Empty state placeholder with icon, title, subtitle and optional action button.
 *
 * Usage:
 *   <EmptyState icon={Bus} title="Không có chuyến xe" subtitle="Thử tìm kiếm lại" />
 *   <EmptyState icon={Ticket} title="Chưa có vé" action={<button ...>Đặt vé</button>} />
 */
export default function EmptyState({ icon: Icon, title, subtitle, action, minHeight = '200px' }) {
  return (
    <div className="empty-state" style={{ minHeight }}>
      {Icon && <Icon size={48} color="var(--gray-300)" />}
      {title && (
        <div style={{ fontWeight: '700', color: 'var(--gray-500)', fontSize: '15px' }}>
          {title}
        </div>
      )}
      {subtitle && (
        <div style={{ fontSize: '13px', color: 'var(--gray-400)' }}>
          {subtitle}
        </div>
      )}
      {action}
    </div>
  );
}
