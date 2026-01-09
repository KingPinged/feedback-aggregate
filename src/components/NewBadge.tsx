interface NewBadgeProps {
  pulse?: boolean;
  className?: string;
}

export function NewBadge({ pulse = true, className = '' }: NewBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-500 text-white ${
        pulse ? 'animate-pulse' : ''
      } ${className}`}
    >
      NEW
    </span>
  );
}

interface UnreadCountBadgeProps {
  count: number;
  className?: string;
}

export function UnreadCountBadge({ count, className = '' }: UnreadCountBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-bold bg-red-500 text-white animate-pulse ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
