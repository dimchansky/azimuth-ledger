import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AngleUnit } from '../domain/types';

interface AddLegFormState {
  azimuth: string;
  length: string;
  label: string;
  lastAngleUnit: AngleUnit;
  setAzimuth: (v: string) => void;
  setLength: (v: string) => void;
  setLabel: (v: string) => void;
  setLastAngleUnit: (v: AngleUnit) => void;
  clearForm: () => void;
}

export const useAddLegFormStore = create<AddLegFormState>()(
  persist(
    (set) => ({
      azimuth: '',
      length: '',
      label: '',
      lastAngleUnit: 'degrees',
      setAzimuth: (v) => set({ azimuth: v }),
      setLength: (v) => set({ length: v }),
      setLabel: (v) => set({ label: v }),
      setLastAngleUnit: (v) => set({ lastAngleUnit: v }),
      clearForm: () => set({ azimuth: '', length: '', label: '' }),
    }),
    { name: 'azimuth-ledger-add-leg' },
  ),
);
