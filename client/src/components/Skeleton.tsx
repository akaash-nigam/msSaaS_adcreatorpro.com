import './Skeleton.css';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  className = ''
}: SkeletonProps) {
  const getStyles = () => {
    const baseStyle: React.CSSProperties = {
      width: width || '100%',
      height: height || (variant === 'text' ? '1em' : '100%')
    };

    return baseStyle;
  };

  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`skeleton skeleton-${variant} ${className}`}
      style={getStyles()}
    />
  ));

  return count > 1 ? <>{skeletons}</> : skeletons[0];
}

// Pre-built skeleton components for common use cases
export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <Skeleton variant="rectangular" height="150px" />
      <div style={{ padding: '16px' }}>
        <Skeleton variant="text" width="70%" height="24px" />
        <Skeleton variant="text" width="100%" height="16px" style={{ marginTop: '8px' }} />
        <Skeleton variant="text" width="90%" height="16px" style={{ marginTop: '4px' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
          <Skeleton variant="text" width="30%" height="20px" />
          <Skeleton variant="text" width="25%" height="20px" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-list-item">
          <Skeleton variant="circular" width="48px" height="48px" />
          <div style={{ flex: 1, marginLeft: '16px' }}>
            <Skeleton variant="text" width="40%" height="20px" />
            <Skeleton variant="text" width="80%" height="16px" style={{ marginTop: '8px' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton-text">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '60%' : '100%'}
          height="16px"
          style={{ marginBottom: '8px' }}
        />
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="skeleton-profile">
      <Skeleton variant="circular" width="80px" height="80px" />
      <div style={{ flex: 1, marginLeft: '16px' }}>
        <Skeleton variant="text" width="200px" height="24px" />
        <Skeleton variant="text" width="150px" height="16px" style={{ marginTop: '8px' }} />
        <Skeleton variant="text" width="180px" height="16px" style={{ marginTop: '4px' }} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        <Skeleton variant="text" width="100%" height="40px" />
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton-table-row">
          <Skeleton variant="text" width="25%" height="32px" />
          <Skeleton variant="text" width="30%" height="32px" />
          <Skeleton variant="text" width="20%" height="32px" />
          <Skeleton variant="text" width="15%" height="32px" />
        </div>
      ))}
    </div>
  );
}
