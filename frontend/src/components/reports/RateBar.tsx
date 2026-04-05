interface RateBarProps {
  value: number;
  /** Show numeric label next to bar (default true) */
  showLabel?: boolean;
  /** Width class for the bar track (default "w-20") */
  trackClass?: string;
}

export default function RateBar({ value, showLabel = true, trackClass = 'w-20' }: RateBarProps) {
  const color =
    value >= 80 ? 'bg-emerald-500'
    : value >= 50 ? 'bg-amber-500'
    : 'bg-[#EC0000]';

  const textColor =
    value >= 80 ? 'text-emerald-600 dark:text-emerald-400'
    : value >= 50 ? 'text-amber-600 dark:text-amber-400'
    : 'text-[#EC0000]';

  return (
    <div className="flex items-center gap-2">
      <div className={`${trackClass} h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-mono font-semibold ${textColor}`}>{value}%</span>
      )}
    </div>
  );
}
