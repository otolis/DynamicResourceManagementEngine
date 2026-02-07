import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface PinsContextType {
  pins: Set<string>; // Set of pinned project IDs
  isPinned: (projectId: string) => boolean;
  togglePin: (projectId: string) => void;
  addPin: (projectId: string) => void;
  removePin: (projectId: string) => void;
}

const PinsContext = createContext<PinsContextType | null>(null);

const STORAGE_KEY = 'drme:pins';

export function PinsProvider({ children }: { children: ReactNode }) {
  const [pins, setPins] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...pins]));
  }, [pins]);

  const isPinned = (projectId: string) => pins.has(projectId);

  const togglePin = (projectId: string) => {
    setPins((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const addPin = (projectId: string) => {
    setPins((prev) => new Set([...prev, projectId]));
  };

  const removePin = (projectId: string) => {
    setPins((prev) => {
      const next = new Set(prev);
      next.delete(projectId);
      return next;
    });
  };

  return (
    <PinsContext.Provider value={{ pins, isPinned, togglePin, addPin, removePin }}>
      {children}
    </PinsContext.Provider>
  );
}

export function usePins() {
  const context = useContext(PinsContext);
  if (!context) {
    throw new Error('usePins must be used within a PinsProvider');
  }
  return context;
}
