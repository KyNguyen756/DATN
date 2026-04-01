/**
 * CompanyLogo — displays a bus company's logo with a letter-avatar fallback.
 * Props:
 *   logo     {string}  Cloudinary URL (optional)
 *   name     {string}  Company name for fallback initial
 *   size     {number}  Pixel size of the avatar (default 36)
 *   radius   {string}  Border-radius (default '10px')
 */
export default function CompanyLogo({ logo, name = '', size = 36, radius = '10px' }) {
  const initial = (name || '?')[0].toUpperCase();

  if (logo) {
    return (
      <img
        src={logo}
        alt={name}
        style={{
          width: size, height: size, borderRadius: radius,
          objectFit: 'cover', flexShrink: 0,
          border: '1px solid var(--gray-200)',
        }}
        onError={(e) => { e.target.style.display = 'none'; }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: radius,
      background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: '700', fontSize: size * 0.38,
      flexShrink: 0,
    }}>
      {initial}
    </div>
  );
}
