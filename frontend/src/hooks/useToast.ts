// Hook: useToast - Gerenciador de Toasts/Notificações
import { useState, useCallback } from 'react';
import type { ToastType } from '../components/Toast';

interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((
    message: string,
    type: ToastType = 'info',
    title?: string,
    duration = 5000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, type, title, message, duration };
    
    setToasts((prev) => [...prev, newToast]);
    
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string, title?: string, duration?: number) => {
    return addToast(message, 'success', title, duration);
  }, [addToast]);

  const error = useCallback((message: string, title?: string, duration?: number) => {
    return addToast(message, 'error', title, duration);
  }, [addToast]);

  const info = useCallback((message: string, title?: string, duration?: number) => {
    return addToast(message, 'info', title, duration);
  }, [addToast]);

  const warning = useCallback((message: string, title?: string, duration?: number) => {
    return addToast(message, 'warning', title, duration);
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    info,
    warning,
  };
}
