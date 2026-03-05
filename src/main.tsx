import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './global.css';

// Apply persisted theme before first paint to prevent flash
(() => {
  try {
    const raw = localStorage.getItem('azimuth-ledger-settings');
    if (raw) {
      const { state } = JSON.parse(raw);
      if (state?.themePreference && state.themePreference !== 'auto') {
        document.documentElement.dataset.theme = state.themePreference;
      }
    }
  } catch { /* ignore */ }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
