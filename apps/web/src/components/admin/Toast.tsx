'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  /** true once the dismiss animation has started */
  exiting: boolean;
}

export interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_TOASTS = 5;
const AUTO_DISMISS_MS = 4000;
const EXIT_ANIMATION_MS = 350;

const TYPE_COLORS: Record<ToastType, string> = {
  success: '#16a34a',
  error:   '#dc2626',
  warning: '#d97706',
  info:    '#2563eb',
};

const TYPE_BG: Record<ToastType, string> = {
  success: '#f0fdf4',
  error:   '#fef2f2',
  warning: '#fffbeb',
  info:    '#eff6ff',
};

const TYPE_ICONS: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
};

// ─── CSS Keyframes ────────────────────────────────────────────────────────────

const ANIMATION_STYLES = `
@keyframes toast-slide-in {
  from {
    transform: translateX(110%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes toast-fade-out {
  from {
    transform: translateX(0);
    opacity: 1;
    max-height: 80px;
    margin-bottom: 8px;
  }
  to {
    transform: translateX(110%);
    opacity: 0;
    max-height: 0;
    margin-bottom: 0;
  }
}
`;

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Individual Toast ─────────────────────────────────────────────────────────

interface ToastItemProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

function ToastCard({ item, onDismiss }: ToastItemProps) {
  const borderColor = TYPE_COLORS[item.type];
  const bgColor = TYPE_BG[item.type];
  const icon = TYPE_ICONS[item.type];

  const cardStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    background: '#ffffff',
    borderLeft: `4px solid ${borderColor}`,
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.10), 0 1px 3px rgba(0,0,0,0.06)',
    padding: '12px 14px',
    minWidth: '280px',
    maxWidth: '360px',
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#1f2937',
    animation: item.exiting
      ? `toast-fade-out ${EXIT_ANIMATION_MS}ms ease forwards`
      : `toast-slide-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
    position: 'relative',
    overflow: 'hidden',
  };

  const iconWrapStyle: React.CSSProperties = {
    flexShrink: 0,
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: bgColor,
    border: `1.5px solid ${borderColor}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: borderColor,
    fontSize: '11px',
    fontWeight: 700,
    marginTop: '1px',
  };

  const messageStyle: React.CSSProperties = {
    flex: 1,
    wordBreak: 'break-word',
  };

  const closeStyle: React.CSSProperties = {
    flexShrink: 0,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0 0 0 4px',
    color: '#9ca3af',
    fontSize: '16px',
    lineHeight: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '1px',
    transition: 'color 150ms',
  };

  return (
    <div style={cardStyle} role="alert" aria-live="assertive">
      <span style={iconWrapStyle} aria-hidden="true">
        {icon}
      </span>
      <span style={messageStyle}>{item.message}</span>
      <button
        style={closeStyle}
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#374151';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af';
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const scheduleRemoval = useCallback((id: string) => {
    const exitTimer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      timersRef.current.delete(id);
    }, EXIT_ANIMATION_MS);

    timersRef.current.set(id + '_exit', exitTimer);
  }, []);

  const startExiting = useCallback(
    (id: string) => {
      const autoTimer = timersRef.current.get(id);
      if (autoTimer) {
        clearTimeout(autoTimer);
        timersRef.current.delete(id);
      }

      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
      );

      scheduleRemoval(id);
    },
    [scheduleRemoval]
  );

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      setToasts((prev) => {
        const next = [...prev, { id, message, type, exiting: false }];
        // If over limit, mark the oldest non-exiting ones as exiting
        if (next.length > MAX_TOASTS) {
          const excess = next.length - MAX_TOASTS;
          let removed = 0;
          return next.map((t) => {
            if (!t.exiting && removed < excess) {
              removed++;
              return { ...t, exiting: true };
            }
            return t;
          });
        }
        return next;
      });

      const autoTimer = setTimeout(() => {
        startExiting(id);
      }, AUTO_DISMISS_MS);

      timersRef.current.set(id, autoTimer);
    },
    [startExiting]
  );

  // Clear all timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    alignItems: 'flex-end',
    pointerEvents: 'none',
  };

  const itemWrapStyle: React.CSSProperties = {
    pointerEvents: 'auto',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      <style dangerouslySetInnerHTML={{ __html: ANIMATION_STYLES }} />
      {children}
      <div style={containerStyle} aria-label="Notifications">
        {toasts.map((item) => (
          <div key={item.id} style={itemWrapStyle}>
            <ToastCard item={item} onDismiss={startExiting} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
