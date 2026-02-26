// Componente: Modal Moderno com Backdrop
import React, { useEffect } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeButton?: boolean;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeButton = true,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={clsx(
          'relative w-full mx-4 rounded-2xl',
          'bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-white/10',
          'shadow-2xl animate-in fade-in zoom-in duration-200',
          sizeStyles[size]
        )}
      >
        {/* Header */}
        {(title || closeButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-white/10">
            {title && <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>}
            {closeButton && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors ml-auto"
              >
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700 dark:text-white/60 dark:hover:text-white" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-6 border-t border-gray-200 dark:border-white/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
