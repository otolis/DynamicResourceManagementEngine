import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Flag } from 'lucide-react';
import { usePriority, type PriorityLevel } from '../../context/PriorityContext';
import anime from 'animejs';

interface PriorityPickerProps {
  projectId: string;
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

export function PriorityPicker({ projectId, size = 'md', showLabel = true }: PriorityPickerProps) {
  const { priorities, getPriority, setPriority, clearPriority } = usePriority();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentPriority = getPriority(projectId);

  useEffect(() => {
    if (isOpen && menuRef.current) {
      anime({
        targets: menuRef.current,
        opacity: [0, 1],
        translateY: [-8, 0],
        duration: 200,
        easing: 'easeOutQuad',
      });
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (priority: PriorityLevel | null) => {
    if (priority) {
      setPriority(projectId, priority.id);
    } else {
      clearPriority(projectId);
    }
    setIsOpen(false);
  };

  const iconSize = size === 'sm' ? 14 : 18;
  const padding = size === 'sm' ? 'var(--spacing-xs) var(--spacing-sm)' : 'var(--spacing-sm) var(--spacing-md)';

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xs)',
          padding,
          background: currentPriority ? `${currentPriority.color}20` : 'var(--glass-bg)',
          border: `1px solid ${currentPriority ? `${currentPriority.color}40` : 'var(--glass-border)'}`,
          borderRadius: 'var(--radius-md)',
          color: currentPriority ? currentPriority.color : 'var(--color-text-muted)',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
          fontSize: size === 'sm' ? '0.75rem' : '0.875rem',
        }}
      >
        {currentPriority ? (
          <>
            <span>{currentPriority.emoji}</span>
            {showLabel && <span>{currentPriority.label}</span>}
          </>
        ) : (
          <>
            <Flag size={iconSize} />
            {showLabel && <span>Priority</span>}
          </>
        )}
        <ChevronDown size={iconSize} style={{ opacity: 0.6 }} />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 'var(--spacing-xs)',
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-xs)',
            minWidth: '160px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
          }}
        >
          {priorities.map((priority) => (
            <button
              key={priority.id}
              onClick={() => handleSelect(priority)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                width: '100%',
                padding: 'var(--spacing-sm) var(--spacing-md)',
                background: currentPriority?.id === priority.id ? 'var(--glass-bg-active)' : 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => {
                if (currentPriority?.id !== priority.id) {
                  e.currentTarget.style.background = 'var(--glass-bg-hover)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPriority?.id !== priority.id) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <span>{priority.emoji}</span>
              <span style={{ color: priority.color }}>{priority.label}</span>
            </button>
          ))}
          
          {currentPriority && (
            <>
              <div style={{ height: 1, background: 'var(--glass-border)', margin: 'var(--spacing-xs) 0' }} />
              <button
                onClick={() => handleSelect(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  width: '100%',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                ✕ Clear priority
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Compact badge for sidebar display
export function PriorityBadge({ projectId }: { projectId: string }) {
  const { getPriority } = usePriority();
  const priority = getPriority(projectId);

  if (!priority) return null;

  return (
    <span
      title={priority.label}
      style={{
        fontSize: '0.875rem',
        lineHeight: 1,
      }}
    >
      {priority.emoji}
    </span>
  );
}
