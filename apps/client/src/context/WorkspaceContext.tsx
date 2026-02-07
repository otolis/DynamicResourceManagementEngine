// Workspace Context for tabbed project management

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { EntityType } from '../api';

export interface WorkspaceTab {
  id: string;
  title: string;
  type: 'project' | 'schema' | 'settings';
  data?: EntityType;
}

interface WorkspaceContextType {
  tabs: WorkspaceTab[];
  activeTabId: string | null;
  openTab: (tab: Omit<WorkspaceTab, 'id'> & { id?: string }) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  getActiveTab: () => WorkspaceTab | undefined;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export function WorkspaceProvider({ children }: WorkspaceProviderProps) {
  const [tabs, setTabs] = useState<WorkspaceTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const openTab = (tab: Omit<WorkspaceTab, 'id'> & { id?: string }) => {
    const tabId = tab.id || `tab-${Date.now()}`;
    
    // Check if tab already exists
    const existingTab = tabs.find((t) => t.id === tabId);
    if (existingTab) {
      setActiveTabId(tabId);
      return;
    }

    const newTab: WorkspaceTab = {
      id: tabId,
      title: tab.title,
      type: tab.type,
      data: tab.data,
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(tabId);
  };

  const closeTab = (id: string) => {
    setTabs((prev) => {
      const newTabs = prev.filter((t) => t.id !== id);
      
      // If closing active tab, switch to another
      if (activeTabId === id && newTabs.length > 0) {
        const index = prev.findIndex((t) => t.id === id);
        const newActiveIndex = Math.min(index, newTabs.length - 1);
        setActiveTabId(newTabs[newActiveIndex]?.id || null);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
      }
      
      return newTabs;
    });
  };

  const setActiveTab = (id: string) => {
    if (tabs.find((t) => t.id === id)) {
      setActiveTabId(id);
    }
  };

  const getActiveTab = () => {
    return tabs.find((t) => t.id === activeTabId);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        tabs,
        activeTabId,
        openTab,
        closeTab,
        setActiveTab,
        getActiveTab,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
