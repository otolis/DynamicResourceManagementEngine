import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface RecentProject {
  id: string;
  name: string;
  accessedAt: number;
}

interface RecentContextType {
  recentProjects: RecentProject[];
  addRecent: (projectId: string, projectName: string) => void;
  clearRecent: () => void;
  getRecentIds: () => string[];
}

const RecentContext = createContext<RecentContextType | null>(null);

const STORAGE_KEY = 'drme:recent';
const MAX_RECENT = 10;

export function RecentProvider({ children }: { children: ReactNode }) {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recentProjects));
  }, [recentProjects]);

  const addRecent = (projectId: string, projectName: string) => {
    setRecentProjects((prev) => {
      // Remove if already exists
      const filtered = prev.filter((p) => p.id !== projectId);
      // Add to front
      const updated = [
        { id: projectId, name: projectName, accessedAt: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT);
      return updated;
    });
  };

  const clearRecent = () => {
    setRecentProjects([]);
  };

  const getRecentIds = () => recentProjects.map((p) => p.id);

  return (
    <RecentContext.Provider value={{ recentProjects, addRecent, clearRecent, getRecentIds }}>
      {children}
    </RecentContext.Provider>
  );
}

export function useRecent() {
  const context = useContext(RecentContext);
  if (!context) {
    throw new Error('useRecent must be used within a RecentProvider');
  }
  return context;
}
