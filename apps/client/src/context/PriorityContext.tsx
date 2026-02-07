import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// Default priority levels - users can customize these
export interface PriorityLevel {
  id: string;
  label: string;
  color: string;
  emoji: string;
  order: number;
}

export const DEFAULT_PRIORITIES: PriorityLevel[] = [
  { id: 'critical', label: 'Critical', color: '#ef4444', emoji: '🔴', order: 0 },
  { id: 'high', label: 'High', color: '#f97316', emoji: '🟠', order: 1 },
  { id: 'medium', label: 'Medium', color: '#eab308', emoji: '🟡', order: 2 },
  { id: 'low', label: 'Low', color: '#22c55e', emoji: '🟢', order: 3 },
  { id: 'none', label: 'None', color: '#64748b', emoji: '⚪', order: 4 },
];

interface PriorityContextType {
  priorities: PriorityLevel[];
  projectPriorities: Record<string, string>; // projectId -> priorityId
  getPriority: (projectId: string) => PriorityLevel | undefined;
  setPriority: (projectId: string, priorityId: string) => void;
  clearPriority: (projectId: string) => void;
  updatePriorityLevel: (priorityId: string, updates: Partial<PriorityLevel>) => void;
  addPriorityLevel: (priority: Omit<PriorityLevel, 'order'>) => void;
  removePriorityLevel: (priorityId: string) => void;
  resetToDefaults: () => void;
}

const PriorityContext = createContext<PriorityContextType | null>(null);

const STORAGE_KEY_PRIORITIES = 'drme:priority-levels';
const STORAGE_KEY_PROJECT_PRIORITIES = 'drme:project-priorities';

export function PriorityProvider({ children }: { children: ReactNode }) {
  const [priorities, setPriorities] = useState<PriorityLevel[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PRIORITIES);
    return saved ? JSON.parse(saved) : DEFAULT_PRIORITIES;
  });

  const [projectPriorities, setProjectPriorities] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROJECT_PRIORITIES);
    return saved ? JSON.parse(saved) : {};
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PRIORITIES, JSON.stringify(priorities));
  }, [priorities]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROJECT_PRIORITIES, JSON.stringify(projectPriorities));
  }, [projectPriorities]);

  const getPriority = (projectId: string): PriorityLevel | undefined => {
    const priorityId = projectPriorities[projectId];
    if (!priorityId) return undefined;
    return priorities.find((p) => p.id === priorityId);
  };

  const setPriority = (projectId: string, priorityId: string) => {
    setProjectPriorities((prev) => ({ ...prev, [projectId]: priorityId }));
  };

  const clearPriority = (projectId: string) => {
    setProjectPriorities((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
  };

  const updatePriorityLevel = (priorityId: string, updates: Partial<PriorityLevel>) => {
    setPriorities((prev) =>
      prev.map((p) => (p.id === priorityId ? { ...p, ...updates } : p))
    );
  };

  const addPriorityLevel = (priority: Omit<PriorityLevel, 'order'>) => {
    setPriorities((prev) => [...prev, { ...priority, order: prev.length }]);
  };

  const removePriorityLevel = (priorityId: string) => {
    setPriorities((prev) => prev.filter((p) => p.id !== priorityId));
    // Clear any project priorities using this level
    setProjectPriorities((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((projectId) => {
        if (next[projectId] === priorityId) {
          delete next[projectId];
        }
      });
      return next;
    });
  };

  const resetToDefaults = () => {
    setPriorities(DEFAULT_PRIORITIES);
  };

  return (
    <PriorityContext.Provider
      value={{
        priorities,
        projectPriorities,
        getPriority,
        setPriority,
        clearPriority,
        updatePriorityLevel,
        addPriorityLevel,
        removePriorityLevel,
        resetToDefaults,
      }}
    >
      {children}
    </PriorityContext.Provider>
  );
}

export function usePriority() {
  const context = useContext(PriorityContext);
  if (!context) {
    throw new Error('usePriority must be used within a PriorityProvider');
  }
  return context;
}
