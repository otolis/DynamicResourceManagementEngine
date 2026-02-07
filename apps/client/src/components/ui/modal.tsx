import { useState, useRef, useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { CyberButton } from './cyberButton';
import anime from 'animejs';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && overlayRef.current && contentRef.current) {
      // Animate in
      anime({
        targets: overlayRef.current,
        opacity: [0, 1],
        duration: 200,
        easing: 'easeOutCubic',
      });
      anime({
        targets: contentRef.current,
        scale: [0.95, 1],
        opacity: [0, 1],
        duration: 300,
        easing: 'easeOutBack',
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--spacing-lg)',
      }}
    >
      <div
        ref={contentRef}
        className="modal-content"
        style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--spacing-lg)',
            borderBottom: '1px solid var(--glass-border)',
          }}
        >
          <h2 style={{ color: 'var(--color-text-bright)', fontSize: '1.25rem', margin: 0 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              padding: 'var(--spacing-xs)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              transition: 'color 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'var(--color-text-muted)')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 'var(--spacing-lg)', overflow: 'auto', flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 'var(--spacing-md)',
              padding: 'var(--spacing-lg)',
              borderTop: '1px solid var(--glass-border)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// Convenience component for create/edit forms
interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; displayName: string; description: string }) => Promise<void>;
  title: string;
  submitLabel?: string;
  isLoading?: boolean;
}

export function CreateEntityModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  submitLabel = 'Create',
  isLoading = false,
}: CreateModalProps) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDisplayName('');
      setDescription('');
      setError(null);
    }
  }, [isOpen]);

  // Auto-generate name from displayName
  const handleDisplayNameChange = (value: string) => {
    setDisplayName(value);
    // Convert to snake_case for name
    const autoName = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
    setName(autoName);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      await onSubmit({ name, displayName, description });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message :
        (err as { message?: string })?.message || 'Failed to create';
      setError(message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <>
          <CyberButton variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </CyberButton>
          <CyberButton variant="primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Creating...' : submitLabel}
          </CyberButton>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div
            style={{
              padding: 'var(--spacing-md)',
              background: 'var(--color-error-bg)',
              color: 'var(--color-error)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 'var(--spacing-lg)',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
          <div>
            <label
              style={{
                display: 'block',
                color: 'var(--color-text-muted)',
                fontSize: '0.875rem',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              Display Name *
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => handleDisplayNameChange(e.target.value)}
              placeholder="e.g. Customer Order"
              className="cyber-input"
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text)',
                fontSize: '1rem',
              }}
              autoFocus
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                color: 'var(--color-text-muted)',
                fontSize: '0.875rem',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              System Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. customer_order"
              className="cyber-input"
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-muted)',
                fontSize: '0.875rem',
                fontFamily: 'monospace',
              }}
            />
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', marginTop: 'var(--spacing-xs)' }}>
              Auto-generated from display name. Used in code and APIs.
            </p>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                color: 'var(--color-text-muted)',
                fontSize: '0.875rem',
                marginBottom: 'var(--spacing-xs)',
              }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this entity..."
              rows={3}
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text)',
                fontSize: '1rem',
                resize: 'vertical',
              }}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
