// Componente: Alert Moderno
import React from 'react';
import clsx from 'clsx';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
  closable?: boolean;
  icon?: React.ReactNode;
}

const alertStyles = {
  info: {
    bg: 'bg-blue-600/20',
    border: 'border-blue-600/50',
    text: 'text-blue-300',
    icon: Info,
  },
  success: {
    bg: 'bg-green-600/20',
    border: 'border-green-600/50',
    text: 'text-green-300',
    icon: CheckCircle,
  },
  warning: {
    bg: 'bg-yellow-600/20',
    border: 'border-yellow-600/50',
    text: 'text-yellow-300',
    icon: AlertTriangle,
  },
  error: {
    bg: 'bg-red-600/20',
    border: 'border-red-600/50',
    text: 'text-red-300',
    icon: AlertCircle,
  },
};

export default function Alert({
  type = 'info',
  title,
  message,
  onClose,
  closable = true,
  icon: customIcon,
  className,
  ...props
}: AlertProps) {
  const style = alertStyles[type];
  const Icon = customIcon ? () => customIcon : style.icon;

  return (
    <div
      className={clsx(
        'flex gap-4 p-4 rounded-lg border',
        style.bg,
        style.border,
        className
      )}
      {...props}
    >
      <Icon className={clsx('w-5 h-5 flex-shrink-0 mt-0.5', style.text)} />

      <div className="flex-1">
        {title && <h4 className="font-semibold text-white mb-1">{title}</h4>}
        <p className="text-sm text-white/80">{message}</p>
      </div>

      {closable && onClose && (
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-white/60 hover:text-white" />
        </button>
      )}
    </div>
  );
}
