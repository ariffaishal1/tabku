import { useState, useCallback } from 'react';
import type { ToastItem } from '../components/Overlays/ToastNotification';

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) => {
        // Prevent duplicate toast if an identical toast (title & message) is already active
        const exists = prev.some(
          (t) => t.title === toast.title && t.message === toast.message
        );
        if (exists) return prev;

        const newToast: ToastItem = { ...toast, id };
        return [...prev.slice(-3), newToast]; // keep max 4 toasts
      });
      return id;
    },
    []
  );

  const showError = useCallback(
    (title: string, message?: string, duration = 5000) => {
      return showToast({ type: 'error', title, message, duration });
    },
    [showToast]
  );

  const showSuccess = useCallback(
    (title: string, message?: string, duration = 3500) => {
      return showToast({ type: 'success', title, message, duration });
    },
    [showToast]
  );

  const showInfo = useCallback(
    (title: string, message?: string, duration = 3500) => {
      return showToast({ type: 'info', title, message, duration });
    },
    [showToast]
  );

  const showWarning = useCallback(
    (title: string, message?: string, duration = 4000) => {
      return showToast({ type: 'warning', title, message, duration });
    },
    [showToast]
  );

  return {
    toasts,
    showToast,
    dismissToast,
    showError,
    showSuccess,
    showInfo,
    showWarning,
  };
};
