import { Loader } from 'lucide-react';

/**
 * Centered loading spinner
 * @param {number} size - icon size (default 32)
 * @param {string} minHeight - wrapper min-height (default '200px')
 */
export default function Spinner({ size = 32, minHeight = '200px' }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight,
    }}>
      <Loader
        size={size}
        color="var(--primary)"
        style={{ animation: 'spin 1s linear infinite' }}
      />
    </div>
  );
}
