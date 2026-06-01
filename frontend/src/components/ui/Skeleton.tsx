interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-2xl',
  };

  return (
    <div
      className={`
        bg-gradient-to-r from-lavender-100 via-lavender-50 to-lavender-100
        bg-[length:200%_100%] animate-shimmer
        ${variantClasses[variant]}
        ${className}
      `}
      style={{
        width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
        height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
      }}
    />
  );
}

// Pre-built skeleton patterns
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <Skeleton variant="rectangular" className="w-full h-64" />
      <div className="p-4 space-y-3">
        <Skeleton width="60%" height={20} />
        <Skeleton width="40%" height={16} />
        <div className="flex justify-between items-center pt-2">
          <Skeleton width={80} height={24} />
          <Skeleton variant="circular" width={40} height={40} />
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Skeleton variant="rounded" className="w-full aspect-square" />
      <div className="space-y-4">
        <Skeleton width="80%" height={32} />
        <Skeleton width="40%" height={24} />
        <Skeleton width="100%" height={16} />
        <Skeleton width="100%" height={16} />
        <Skeleton width="70%" height={16} />
        <div className="pt-4">
          <Skeleton variant="rounded" width="100%" height={48} />
        </div>
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton width={i === 0 ? '80%' : '60%'} />
        </td>
      ))}
    </tr>
  );
}
