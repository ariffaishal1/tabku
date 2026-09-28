import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 9999,
        pointerEvents: 'none',
        maxWidth: '380px',
        width: 'calc(100vw - 40px)',
      }}
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

const ToastCard: React.FC<{ toast: ToastItem; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  useEffect(() => {
    const duration = toast.duration ?? 4000;
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const config = {
    success: {
      color: '#50fa7b',
      bgGlow: 'rgba(80, 250, 123, 0.12)',
      border: '#50fa7b',
      icon: <CheckCircle2 size={16} color="#50fa7b" />,
    },
    error: {
      color: '#ff5555',
      bgGlow: 'rgba(255, 85, 85, 0.15)',
      border: '#ff5555',
      icon: <AlertCircle size={16} color="#ff5555" />,
    },
    warning: {
      color: '#ffb86c',
      bgGlow: 'rgba(255, 184, 108, 0.15)',
      border: '#ffb86c',
      icon: <AlertTriangle size={16} color="#ffb86c" />,
    },
    info: {
      color: '#FF7A65',
      bgGlow: 'rgba(255, 122, 101, 0.15)',
      border: '#FF7A65',
      icon: <Info size={16} color="#FF7A65" />,
    },
  }[toast.type];

  return (
    <div
      className="toast-enter"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 14px',
        backgroundColor: '#1c1515',
        border: `1px solid ${config.border}`,
        borderRadius: '6px',
        boxShadow: `0 8px 24px rgba(0, 0, 0, 0.7), 0 0 16px ${config.bgGlow}`,
        color: '#ffffff',
        pointerEvents: 'auto',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent left highlight bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3.5px',
          backgroundColor: config.color,
        }}
      />

      <div style={{ marginTop: '2px', flexShrink: 0 }}>{config.icon}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            fontWeight: 800,
            color: config.color,
            letterSpacing: '0.4px',
          }}
        >
          {toast.title}
        </div>
        {toast.message && (
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '11px',
              color: '#c5b8b8',
              marginTop: '3px',
              lineHeight: 1.4,
              wordBreak: 'break-word',
            }}
          >
            {toast.message}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#8c7d7d',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '3px',
          transition: 'color 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
        onMouseLeave={(e) => (e.currentTarget.style.color = '#8c7d7d')}
        title="Tutup notifikasi"
      >
        <X size={14} />
      </button>
    </div>
  );
};
