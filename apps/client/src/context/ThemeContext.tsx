import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Apply theme class to body - can be called before React hydration
function applyThemeToDOM(theme: Theme) {
  if (theme === 'light') {
    document.body.classList.add('light-mode');
    document.body.classList.remove('dark-mode');
  } else {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
  }
}

// Get initial theme from localStorage (called synchronously to prevent flash)
function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('theme') as Theme | null;
  return saved || 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Apply theme on mount (synchronously via useState initializer above)
  // and whenever theme changes
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const toggleTheme = () => {
    console.log('[ThemeContext] toggleTheme called. Current theme:', theme);
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    console.log('[ThemeContext] Setting new theme:', newTheme);
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
