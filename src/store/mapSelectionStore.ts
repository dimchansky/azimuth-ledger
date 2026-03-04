import { create } from 'zustand';

export type MapSelection =
  | { type: 'leg'; index: number }
  | { type: 'point'; index: number }
  | null;

interface MapSelectionState {
  mapSelection: MapSelection;
  setMapSelection: (sel: MapSelection) => void;
}

export const useMapSelectionStore = create<MapSelectionState>((set) => ({
  mapSelection: null,
  setMapSelection: (sel) => set({ mapSelection: sel }),
}));
