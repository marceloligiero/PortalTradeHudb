// Componente: Avatar Moderno
import React from 'react';
import clsx from 'clsx';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
  showStatus?: boolean;
  className?: string;
}

const sizeStyles = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-gray-500',
  busy: 'bg-red-500',
  away: 'bg-yellow-500',
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function Avatar({
  src,
  alt,
  name,
  size = 'md',
  status,
  showStatus = false,
  className,
}: AvatarProps) {
  return (
    <div className={clsx('relative inline-block', className)}>
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className={clsx(
            'rounded-full object-cover border-2 border-white/10',
            sizeStyles[size]
          )}
        />
      ) : (
        <div
          className={clsx(
            'rounded-full flex items-center justify-center',
            'bg-gradient-to-br from-red-600/20 to-red-700/10',
            'border-2 border-white/10',
            sizeStyles[size]
          )}
        >
          {name ? (
            <span className="text-white font-semibold text-sm">
              {getInitials(name)}
            </span>
          ) : (
            <User className="w-1/2 h-1/2 text-white/60" />
          )}
        </div>
      )}

      {showStatus && status && (
        <div
          className={clsx(
            'absolute bottom-0 right-0 w-3 h-3 rounded-full',
            'border-2 border-[#0a0a0a]',
            statusColors[status]
          )}
        />
      )}
    </div>
  );
}
