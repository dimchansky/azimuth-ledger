import * as Dialog from '@radix-ui/react-dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import styles from './App.module.css';
import { Sidebar } from './components/Sidebar/Sidebar';
import { MapView } from './components/MapView/MapView';
import { useMediaQuery } from './hooks/useMediaQuery';
import { useThemeEffect } from './hooks/useThemeEffect';
import { useState, useRef } from 'react';

export function App() {
  useThemeEffect();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  return (
    <div className={styles.app}>
      {isMobile && (
        <button
          className={styles.hamburger}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          ☰
        </button>
      )}
      {isMobile ? (
        <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
          <Dialog.Portal>
            <Dialog.Overlay className={styles.backdrop} />
            <Dialog.Content
              className={styles.drawer}
              aria-label="Navigation"
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                closeRef.current?.focus();
              }}
            >
              <VisuallyHidden.Root>
                <Dialog.Title>Navigation Menu</Dialog.Title>
              </VisuallyHidden.Root>
              <Sidebar />
              <Dialog.Close asChild>
                <button ref={closeRef} className={styles.drawerClose} aria-label="Close menu">
                  ✕
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      ) : (
        <div className={styles.sidebar}>
          <Sidebar />
        </div>
      )}
      <div className={styles.map}>
        <MapView />
      </div>
    </div>
  );
}
