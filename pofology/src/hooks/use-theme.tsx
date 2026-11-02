import React, { useEffect } from 'react';

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
}

type ThemeContextType = { theme: Theme; toggleTheme: () => void };
const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = React.useState<Theme>(Theme.DARK);

  const applyTheme = (targetTheme: Theme) => {
    setTheme(targetTheme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', targetTheme);
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(targetTheme);

      if (document.body) {
        document.body.setAttribute('data-theme', targetTheme);
        document.body.classList.remove('light', 'dark');
        document.body.classList.add(targetTheme);
        document.body.style.backgroundColor = targetTheme === Theme.LIGHT ? '#f8fafc' : '#07080d';
        document.body.style.color = targetTheme === Theme.LIGHT ? '#334155' : '#e2e8f0';
      }
    }
    try {
      localStorage.setItem('portfolio-color-theme', targetTheme);
    } catch {
      /* Storage is optional. */
    }
  };

  const toggleTheme = () => {
    const next = theme === Theme.DARK ? Theme.LIGHT : Theme.DARK;
    applyTheme(next);
  };

  useEffect(() => {
    let savedTheme = Theme.DARK;
    try {
      const stored = localStorage.getItem('portfolio-color-theme');
      if (stored === Theme.LIGHT) savedTheme = Theme.LIGHT;
      else if (stored === Theme.DARK) savedTheme = Theme.DARK;
    } catch {
      /* Use default theme */
    }
    applyTheme(savedTheme);
  }, []);

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
