// Componente: Progress Bar Moderno
import React from 'react';
import clsx from 'clsx';

interface ProgressProps {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'red' | 'green' | 'blue' | 'yellow';
  animated?: boolean;
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const colorStyles = {
  red: 'bg-red-600',
  green: 'bg-green-600',
  blue: 'bg-blue-600',
  yellow: 'bg-yellow-600',
};

export default function Progress({
  value,
  label,
  showPercentage = false,
  size = 'md',
  color = 'red',
  animated = true,
}: ProgressProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className="space-y-2">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-white/90 font-medium">{label}</span>}
          {showPercentage && (
            <span className="text-white/60">{clampedValue}%</span>
          )}
        </div>
      )}

      <div className={clsx(
        'w-full rounded-full overflow-hidden bg-white/10',
        sizeStyles[size]
      )}>
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-500 ease-out',
            colorStyles[color],
            animated && 'animate-pulse-glow'
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
