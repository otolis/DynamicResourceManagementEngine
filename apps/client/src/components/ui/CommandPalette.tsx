import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Folder, FileJson, Settings, Command, ArrowRight } from 'lucide-react';
import anime from 'animejs';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  category: 'project' | 'schema' | 'navigation' | 'action';
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
}

function fuzzyMatch(query: string, text: string): boolean {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Simple substring check
  if (textLower.includes(queryLower)) return true;
  
  // Fuzzy character matching
  let queryIndex = 0;
  for (const char of textLower) {
    if (char === queryLower[queryIndex]) {
      queryIndex++;
      if (queryIndex === queryLower.length) return true;
    }
  }
  return false;
}

export function CommandPalette({ isOpen, onClose, commands }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    return commands.filter((cmd) => {
      const searchText = `${cmd.label} ${cmd.description || ''} ${(cmd.keywords || []).join(' ')}`;
      return fuzzyMatch(query, searchText);
    });
  }, [commands, query]);

  // Group by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  const flatCommands = useMemo(() => {
    return Object.values(groupedCommands).flat();
  }, [groupedCommands]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);

      if (overlayRef.current && contentRef.current) {
        anime({
          targets: overlayRef.current,
          opacity: [0, 1],
          duration: 150,
          easing: 'easeOutQuad',
        });
        anime({
          targets: contentRef.current,
          scale: [0.98, 1],
          opacity: [0, 1],
          translateY: [-10, 0],
          duration: 200,
          easing: 'easeOutQuad',
        });
      }
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatCommands[selectedIndex]) {
          flatCommands[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const categoryLabels: Record<string, string> = {
    project: 'Projects',
    schema: 'Schemas',
    navigation: 'Navigation',
    action: 'Actions',
  };

  let currentIndex = -1;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '15vh',
        zIndex: 1000,
      }}
    >
      <div
        ref={contentRef}
        style={{
          width: '100%',
          maxWidth: '580px',
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Search input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderBottom: '1px solid var(--glass-border)',
            gap: 'var(--spacing-sm)',
          }}
        >
          <Search size={20} style={{ color: 'var(--color-text-muted)' }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search projects, schemas, actions..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--color-text)',
              fontSize: '1rem',
            }}
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
              padding: '4px 8px',
              background: 'var(--glass-bg)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
            }}
          >
            <Command size={12} />
            K
          </div>
        </div>

        {/* Results */}
        <div style={{ maxHeight: '400px', overflow: 'auto', padding: 'var(--spacing-sm)' }}>
          {flatCommands.length === 0 ? (
            <div
              style={{
                padding: 'var(--spacing-xl)',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
              }}
            >
              No results found for "{query}"
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, items]) => (
              <div key={category} style={{ marginBottom: 'var(--spacing-sm)' }}>
                <div
                  style={{
                    padding: 'var(--spacing-xs) var(--spacing-md)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {categoryLabels[category] || category}
                </div>
                {items.map((cmd) => {
                  currentIndex++;
                  const isSelected = currentIndex === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      onClick={() => {
                        cmd.action();
                        onClose();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-md)',
                        width: '100%',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        background: isSelected ? 'var(--glass-bg-active)' : 'transparent',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.1s',
                      }}
                    >
                      <span style={{ color: 'var(--color-accent)' }}>{cmd.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500 }}>{cmd.label}</div>
                        {cmd.description && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      {isSelected && (
                        <ArrowRight size={16} style={{ color: 'var(--color-text-muted)' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hints */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--spacing-lg)',
            padding: 'var(--spacing-sm) var(--spacing-lg)',
            borderTop: '1px solid var(--glass-border)',
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
          }}
        >
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}

// Hook to generate commands from projects and schemas
export function useCommandPaletteCommands(
  projects: { id: string; displayName: string; description?: string | null }[],
  onOpenProject: (id: string) => void,
  onCreateProject: () => void,
  onNavigate: (path: string) => void,
) {
  return useMemo<CommandItem[]>(() => {
    const projectCommands: CommandItem[] = projects.map((p) => ({
      id: `project-${p.id}`,
      label: p.displayName,
      description: p.description ?? undefined,
      icon: <Folder size={18} />,
      action: () => onOpenProject(p.id),
      category: 'project',
    }));

    const actionCommands: CommandItem[] = [
      {
        id: 'create-project',
        label: 'Create New Project',
        description: 'Create a new entity type',
        icon: <Folder size={18} />,
        action: onCreateProject,
        category: 'action',
        keywords: ['new', 'add'],
      },
    ];

    const navCommands: CommandItem[] = [
      {
        id: 'nav-dashboard',
        label: 'Dashboard',
        description: 'Go to main dashboard',
        icon: <FileJson size={18} />,
        action: () => onNavigate('/app'),
        category: 'navigation',
      },
      {
        id: 'nav-schemas',
        label: 'Schemas',
        description: 'Manage entity schemas',
        icon: <FileJson size={18} />,
        action: () => onNavigate('/app/schemas'),
        category: 'navigation',
      },
      {
        id: 'nav-settings',
        label: 'Settings',
        description: 'User settings and preferences',
        icon: <Settings size={18} />,
        action: () => onNavigate('/app/settings'),
        category: 'navigation',
      },
    ];

    return [...actionCommands, ...navCommands, ...projectCommands];
  }, [projects, onOpenProject, onCreateProject, onNavigate]);
}
