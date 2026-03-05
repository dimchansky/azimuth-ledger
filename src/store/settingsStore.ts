import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AngleUnit } from '../domain/types';

export type ThemePreference = 'auto' | 'light' | 'dark';

interface SettingsState {
  declinationDeg: number;
  angleUnit: AngleUnit;
  milsPerCircle: number;
  gridStep: number;
  unitsLabel: string;
  themePreference: ThemePreference;
  setDeclinationDeg: (v: number) => void;
  setAngleUnit: (v: AngleUnit) => void;
  setMilsPerCircle: (v: number) => void;
  setGridStep: (v: number) => void;
  setUnitsLabel: (v: string) => void;
  setThemePreference: (v: ThemePreference) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      declinationDeg: 0,
      angleUnit: 'degrees',
      milsPerCircle: 6400,
      gridStep: 100,
      unitsLabel: '',
      themePreference: 'auto',
      setDeclinationDeg: (v) => set({ declinationDeg: v }),
      setAngleUnit: (v) => set({ angleUnit: v }),
      setMilsPerCircle: (v) => set({ milsPerCircle: v }),
      setGridStep: (v) => set({ gridStep: v }),
      setUnitsLabel: (v) => set({ unitsLabel: v }),
      setThemePreference: (v) => set({ themePreference: v }),
    }),
    { name: 'azimuth-ledger-settings' },
  ),
);
