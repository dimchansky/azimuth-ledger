import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AngleUnit } from '../domain/types';

interface SettingsState {
  declinationDeg: number;
  angleUnit: AngleUnit;
  milsPerCircle: number;
  gridStep: number;
  unitsLabel: string;
  setDeclinationDeg: (v: number) => void;
  setAngleUnit: (v: AngleUnit) => void;
  setMilsPerCircle: (v: number) => void;
  setGridStep: (v: number) => void;
  setUnitsLabel: (v: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      declinationDeg: 0,
      angleUnit: 'degrees',
      milsPerCircle: 6400,
      gridStep: 100,
      unitsLabel: '',
      setDeclinationDeg: (v) => set({ declinationDeg: v }),
      setAngleUnit: (v) => set({ angleUnit: v }),
      setMilsPerCircle: (v) => set({ milsPerCircle: v }),
      setGridStep: (v) => set({ gridStep: v }),
      setUnitsLabel: (v) => set({ unitsLabel: v }),
    }),
    { name: 'azimuth-ledger-settings' },
  ),
);
