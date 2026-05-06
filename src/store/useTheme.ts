import { create } from 'zustand';
import { useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolved: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
}

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', resolved === 'dark');
}

export const useThemeStore = create<ThemeState>((set) => {
  const saved = (localStorage.getItem('theme') as Theme) || 'system';
  const resolved = saved === 'system' ? getSystemTheme() : saved;
  applyTheme(resolved);

  return {
    theme: saved,
    resolved,
    setTheme: (theme: Theme) => {
      const resolved = theme === 'system' ? getSystemTheme() : theme;
      localStorage.setItem('theme', theme);
      applyTheme(resolved);
      set({ theme, resolved });
    },
  };
});

export function useThemeListener() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const { theme, setTheme } = useThemeStore.getState();
      if (theme === 'system') {
        setTheme('system');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
}
