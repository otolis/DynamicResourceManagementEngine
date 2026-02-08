import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import anime from 'animejs';
import { useEffect, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const TOAST_ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const TOAST_COLORS = {
  success: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', icon: '#10b981' },
  error: { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', icon: '#ef4444' },
  info: { bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.3)', icon: '#6366f1' },
  warning: { bg: 'rgba(234, 179, 8, 0.15)', border: 'rgba(234, 179, 8, 0.3)', icon: '#eab308' },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const Icon = TOAST_ICONS[toast.type];
  const colors = TOAST_COLORS[toast.type];
  const duration = toast.duration ?? 4000;

  useEffect(() => {
    if (ref.current) {
      anime({
        targets: ref.current,
        translateX: [100, 0],
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutBack',
      });
    }

    if (progressRef.current) {
      anime({
        targets: progressRef.current,
        width: ['100%', '0%'],
        duration: duration,
        easing: 'linear',
      });
    }

    const timer = setTimeout(() => {
      if (ref.current) {
        anime({
          targets: ref.current,
          translateX: [0, 100],
          opacity: [1, 0],
          duration: 200,
          easing: 'easeInQuad',
          complete: onRemove,
        });
      }
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onRemove]);

  return (
    <div
      ref={ref}
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-md)',
        display: 'flex',
        gap: 'var(--spacing-sm)',
        minWidth: '300px',
        maxWidth: '420px',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Icon size={20} style={{ color: colors.icon, flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ color: 'var(--color-text-bright)', fontWeight: 500 }}>{toast.title}</div>
        {toast.message && (
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: 2 }}>
            {toast.message}
          </div>
        )}
      </div>
      <button
        onClick={onRemove}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          padding: 4,
          borderRadius: 4,
          display: 'flex',
        }}
      >
        <X size={16} />
      </button>
      {/* Progress bar */}
      <div
        ref={progressRef}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 3,
          background: colors.icon,
          borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
        }}
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
      {/* Toast container */}
      <div
        style={{
          position: 'fixed',
          bottom: 'var(--spacing-lg)',
          right: 'var(--spacing-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-sm)',
          zIndex: 'var(--z-toast)',
        }}
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
