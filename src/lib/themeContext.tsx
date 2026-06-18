import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'warm' | 'cool' | 'dark' | 'forest' | 'midnight';

export const themeConfig: Record<Theme, { label: string; icon: string; light: boolean }> = {
  warm:    { label: 'Warm', icon: '☀️', light: true },
  cool:    { label: 'Cool', icon: '🌊', light: true },
  dark:    { label: 'Dark', icon: '🌙', light: false },
  forest:  { label: 'Forest', icon: '🌲', light: false },
  midnight:{ label: 'Midnight', icon: '⭐', light: false },
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved && themeConfig[saved]) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'warm';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const validThemes = Object.keys(themeConfig) as Theme[];
    validThemes.forEach(t => root.classList.remove(t));
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
