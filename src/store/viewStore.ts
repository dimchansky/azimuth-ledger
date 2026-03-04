import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const MIN_SCALE = 0.01;
export const MAX_SCALE = 1000;

interface ViewState {
  offsetX: number;
  offsetY: number;
  scale: number;
  userHasInteracted: boolean;
  setView: (offsetX: number, offsetY: number, scale: number) => void;
  setUserInteracted: () => void;
  resetInteraction: () => void;
}

function clamp(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(Math.max(value, min), max);
}

function finiteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

export const useViewStore = create<ViewState>()(
  persist(
    (set) => ({
      offsetX: 0,
      offsetY: 0,
      scale: 1,
      userHasInteracted: false,
      setView: (offsetX, offsetY, scale) => set({ offsetX, offsetY, scale }),
      setUserInteracted: () => set({ userHasInteracted: true }),
      resetInteraction: () => set({ userHasInteracted: false }),
    }),
    {
      name: 'azimuth-ledger-view',
      partialize: (state) => ({
        offsetX: state.offsetX,
        offsetY: state.offsetY,
        scale: state.scale,
      }),
      merge: (persisted, currentState) => {
        const p = persisted as Partial<ViewState> | undefined;
        if (!p) return currentState;
        return {
          ...currentState,
          offsetX: finiteOr(p.offsetX ?? 0, 0),
          offsetY: finiteOr(p.offsetY ?? 0, 0),
          scale: clamp(p.scale ?? 1, MIN_SCALE, MAX_SCALE, 1),
        };
      },
    },
  ),
);
