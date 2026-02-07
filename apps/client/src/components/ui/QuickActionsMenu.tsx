import { useState, useRef, useEffect } from 'react';
import { 
  MoreVertical, 
  Pin, 
  Star, 
  Trash2, 
  Copy, 
  Archive,
  Flag
} from 'lucide-react';
import anime from 'animejs';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface QuickActionsMenuProps {
  actions: QuickAction[];
  trigger?: React.ReactNode;
}

export function QuickActionsMenu({ actions, trigger }: QuickActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      anime({
        targets: contentRef.current,
        opacity: [0, 1],
        scale: [0.95, 1],
        translateY: [-4, 0],
        duration: 150,
        easing: 'easeOutQuad',
      });
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleAction = (action: QuickAction) => {
    if (!action.disabled) {
      action.onClick();
      setIsOpen(false);
    }
  };

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          borderRadius: 'var(--radius-sm)',
          transition: 'all 0.15s ease',
          opacity: isOpen ? 1 : 0.6,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
        onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.opacity = '0.6'; }}
      >
        {trigger || <MoreVertical size={16} />}
      </button>

      {isOpen && (
        <div
          ref={contentRef}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-xs)',
            minWidth: '160px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
          }}
        >
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => handleAction(action)}
              disabled={action.disabled}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                width: '100%',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                background: 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: action.danger ? 'var(--color-error)' : 'var(--color-text)',
                cursor: action.disabled ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                fontSize: '0.875rem',
                opacity: action.disabled ? 0.5 : 1,
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => {
                if (!action.disabled) {
                  e.currentTarget.style.background = action.danger 
                    ? 'rgba(239, 68, 68, 0.1)' 
                    : 'var(--glass-bg-hover)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {action.icon}
              </span>
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Pre-built action sets
export function useProjectQuickActions(
  _projectId: string,
  {
    onPin,
    onStar,
    onDelete,
    onDuplicate,
    onArchive,
    onSetPriority,
    isPinned,
    isStarred,
  }: {
    onPin?: () => void;
    onStar?: () => void;
    onDelete?: () => void;
    onDuplicate?: () => void;
    onArchive?: () => void;
    onSetPriority?: () => void;
    isPinned?: boolean;
    isStarred?: boolean;
  }
): QuickAction[] {
  const actions: QuickAction[] = [];

  if (onPin) {
    actions.push({
      id: 'pin',
      label: isPinned ? 'Unpin' : 'Pin to top',
      icon: <Pin size={16} />,
      onClick: onPin,
    });
  }

  if (onStar) {
    actions.push({
      id: 'star',
      label: isStarred ? 'Remove star' : 'Add star',
      icon: <Star size={16} />,
      onClick: onStar,
    });
  }

  if (onSetPriority) {
    actions.push({
      id: 'priority',
      label: 'Set priority',
      icon: <Flag size={16} />,
      onClick: onSetPriority,
    });
  }

  if (onDuplicate) {
    actions.push({
      id: 'duplicate',
      label: 'Duplicate',
      icon: <Copy size={16} />,
      onClick: onDuplicate,
    });
  }

  if (onArchive) {
    actions.push({
      id: 'archive',
      label: 'Archive',
      icon: <Archive size={16} />,
      onClick: onArchive,
    });
  }

  if (onDelete) {
    actions.push({
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 size={16} />,
      onClick: onDelete,
      danger: true,
    });
  }

  return actions;
}
