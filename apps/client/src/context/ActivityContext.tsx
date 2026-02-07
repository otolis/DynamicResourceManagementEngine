import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';

interface Activity {
  id: string;
  type: 'create' | 'update' | 'delete' | 'open' | 'comment';
  entityType: 'project' | 'schema' | 'comment';
  entityId: string;
  entityName: string;
  timestamp: number;
  details?: string;
}

interface ActivityContextType {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  clearActivities: () => void;
  getRecentActivities: (limit?: number) => Activity[];
}

const ActivityContext = createContext<ActivityContextType | null>(null);

const STORAGE_KEY = 'drme:activities';
const MAX_ACTIVITIES = 50;

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  }, [activities]);

  const addActivity = useCallback((activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: `activity-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
    };
    setActivities((prev) => [newActivity, ...prev].slice(0, MAX_ACTIVITIES));
  }, []);

  const clearActivities = useCallback(() => {
    setActivities([]);
  }, []);

  const getRecentActivities = useCallback((limit = 10) => {
    return activities.slice(0, limit);
  }, [activities]);

  return (
    <ActivityContext.Provider value={{ activities, addActivity, clearActivities, getRecentActivities }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error('useActivity must be used within an ActivityProvider');
  }
  return context;
}
