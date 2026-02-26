// Componente: Toast/Notification Moderno
import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onClose?: (id: string) => void;
}

const toastStyles = {
  success: {
    bg: 'bg-green-600/20',
    border: 'border-green-600/50',
    icon: CheckCircle,
    iconColor: 'text-green-400',
  },
  error: {
    bg: 'bg-red-600/20',
    border: 'border-red-600/50',
    icon: AlertCircle,
    iconColor: 'text-red-400',
  },
  info: {
    bg: 'bg-blue-600/20',
    border: 'border-blue-600/50',
    icon: Info,
    iconColor: 'text-blue-400',
  },
  warning: {
    bg: 'bg-yellow-600/20',
    border: 'border-yellow-600/50',
    icon: AlertTriangle,
    iconColor: 'text-yellow-400',
  },
};

export default function Toast({
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  onClose,
}: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const style = toastStyles[type];
  const Icon = style.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose?.(id);
    }, 300);
  };

  return (
    <div
      className={clsx(
        'flex gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm',
        'min-w-[320px] max-w-md',
        style.bg,
        style.border,
        isExiting ? 'animate-slide-out' : 'animate-slide-in'
      )}
    >
      <Icon className={clsx('w-5 h-5 flex-shrink-0 mt-0.5', style.iconColor)} />

      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold text-white mb-1">{title}</h4>
        )}
        <p className="text-sm text-white/80">{message}</p>
      </div>

      <button
        onClick={handleClose}
        className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4 text-white/60 hover:text-white" />
      </button>
    </div>
  );
}

// Container de Toasts
interface ToastContainerProps {
  toasts: ToastProps[];
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function ToastContainer({
  toasts,
  position = 'top-right',
}: ToastContainerProps) {
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div className={clsx('fixed z-50 flex flex-col gap-3', positionStyles[position])}>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </div>
  );
}
