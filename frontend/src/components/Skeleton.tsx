// Componente: Skeleton Loading Moderno
import React from 'react';
import clsx from 'clsx';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  count?: number;
  height?: string;
  circle?: boolean;
  width?: string;
  baseColor?: string;
  highlightColor?: string;
}

export default function Skeleton({
  count = 1,
  height = 'h-4',
  circle = false,
  width = 'w-full',
  baseColor = 'bg-white/10',
  highlightColor = 'bg-white/20',
  className,
  ...props
}: SkeletonProps) {
  const skeletons = Array(count).fill(0);

  return (
    <div className="space-y-3" {...props}>
      {skeletons.map((_, idx) => (
        <div
          key={idx}
          className={clsx(
            'animate-pulse rounded-lg',
            circle && 'rounded-full',
            width,
            height,
            baseColor,
            'shadow-sm',
            className
          )}
          style={{
            backgroundImage: `linear-gradient(
              90deg,
              rgb(255, 255, 255, 0.1) 0%,
              rgb(255, 255, 255, 0.15) 50%,
              rgb(255, 255, 255, 0.1) 100%
            )`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
          }}
        />
      ))}
      
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
}
