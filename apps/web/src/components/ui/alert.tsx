'use client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant: AlertVariant;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const CONFIG: Record<AlertVariant, { bg: string; border: string; icon: string; iconColor: string }> = {
  success: { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.25)',  icon: '✓', iconColor: '#10b981' },
  error:   { bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', icon: '✕', iconColor: '#f87171' },
  warning: { bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.25)',  icon: '⚠', iconColor: '#fbbf24' },
  info:    { bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.25)',  icon: 'ℹ', iconColor: '#818cf8' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Alert({ variant, title, message, onClose, className }: AlertProps) {
  const c = CONFIG[variant];

  return (
    <div
      className={className}
      role="alert"
      style={{
        display: 'flex',
        gap: '0.75rem',
        padding: '0.875rem 1rem',
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '0.625rem',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <span style={{ color: c.iconColor, fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.6, flexShrink: 0 }}>
        {c.icon}
      </span>
      <div style={{ flex: 1 }}>
        {title && (
          <p style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.125rem', color: '#e2e8f0' }}>
            {title}
          </p>
        )}
        <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.5 }}>{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '0.9rem', padding: '0 0.25rem', alignSelf: 'flex-start' }}
          aria-label="Close"
        >
          ✕
        </button>
      )}
    </div>
  );
}
