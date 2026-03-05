import { useEffect } from 'react';
import { useSettingsStore } from '../store/settingsStore';

const LIGHT_THEME_COLOR = '#f5f5f5';
const DARK_THEME_COLOR = '#1a1a2e';

function setMetaThemeColor(color: string) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', color);
}

export function useThemeEffect() {
  const themePreference = useSettingsStore((s) => s.themePreference);

  useEffect(() => {
    const doc = document.documentElement;

    if (themePreference === 'auto') {
      delete doc.dataset.theme;
      // Set meta color based on current system preference
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMetaThemeColor(isDark ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
    } else {
      doc.dataset.theme = themePreference;
      setMetaThemeColor(themePreference === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
    }
  }, [themePreference]);

  // Listen for system preference changes in auto mode
  useEffect(() => {
    if (themePreference !== 'auto') return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setMetaThemeColor(e.matches ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [themePreference]);
}
