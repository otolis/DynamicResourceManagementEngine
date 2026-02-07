import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface FavoritesContextType {
  favorites: Set<string>; // Set of project IDs
  isFavorite: (projectId: string) => boolean;
  toggleFavorite: (projectId: string) => void;
  addFavorite: (projectId: string) => void;
  removeFavorite: (projectId: string) => void;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

const STORAGE_KEY = 'drme:favorites';

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  }, [favorites]);

  const isFavorite = (projectId: string) => favorites.has(projectId);

  const toggleFavorite = (projectId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const addFavorite = (projectId: string) => {
    setFavorites((prev) => new Set([...prev, projectId]));
  };

  const removeFavorite = (projectId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.delete(projectId);
      return next;
    });
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites, isFavorite, toggleFavorite, addFavorite, removeFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
