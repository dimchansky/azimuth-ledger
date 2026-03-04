import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../domain/types';
import type { Segment, Selection } from '../domain/types';
import { reverseRoute, clearRoute } from '../domain/route';
import { computePoints } from '../domain/navigation';
import { useSettingsStore } from './settingsStore';
import { useViewStore } from './viewStore';

interface RouteState {
  segments: Segment[];
  originLabel: string;
  selection: Selection;
  addSegment: (magneticAzimuth: number, length: number, label: string) => void;
  updateSegment: (id: string, patch: Partial<Pick<Segment, 'magneticAzimuth' | 'length' | 'label'>>) => void;
  deleteSegment: (id: string) => void;
  setOriginLabel: (label: string) => void;
  setSelection: (sel: Selection) => void;
  clearRoute: () => void;
  reverseRoute: () => void;
}

export const useRouteStore = create<RouteState>()(
  persist(
    (set, get) => ({
      segments: [],
      originLabel: '',
      selection: { fromIndex: 0, toIndex: 0 },

      addSegment: (magneticAzimuth, length, label) => {
        const seg: Segment = {
          id: generateId(),
          magneticAzimuth,
          length,
          label,
        };
        set((state) => {
          const newSegments = [...state.segments, seg];
          const pointCount = newSegments.length + 1;
          return {
            segments: newSegments,
            selection: { fromIndex: pointCount - 1, toIndex: 0 },
          };
        });
      },

      updateSegment: (id, patch) => {
        set((state) => ({
          segments: state.segments.map((s) =>
            s.id === id ? { ...s, ...patch } : s,
          ),
        }));
      },

      deleteSegment: (id) => {
        set((state) => {
          const newSegments = state.segments.filter((s) => s.id !== id);
          const pointCount = newSegments.length + 1;
          let { fromIndex, toIndex } = state.selection;
          fromIndex = Math.min(fromIndex, pointCount - 1);
          toIndex = Math.min(toIndex, pointCount - 1);
          if (fromIndex === toIndex && pointCount >= 2) {
            fromIndex = pointCount - 1;
            toIndex = 0;
          }
          return { segments: newSegments, selection: { fromIndex, toIndex } };
        });
      },

      setOriginLabel: (label) => set({ originLabel: label }),

      setSelection: (sel) => set({ selection: sel }),

      clearRoute: () => {
        const { segments, originLabel } = clearRoute();
        set({ segments, originLabel, selection: { fromIndex: 0, toIndex: 0 } });
        useViewStore.getState().resetInteraction();
      },

      reverseRoute: () => {
        const state = get();
        const decl = useSettingsStore.getState().declinationDeg;
        const oldPoints = computePoints(state.segments, state.originLabel, decl);
        const last = oldPoints[oldPoints.length - 1];
        const result = reverseRoute(state.segments, state.originLabel, decl);
        const pointCount = result.segments.length + 1;
        set({
          segments: result.segments,
          originLabel: result.originLabel,
          selection: { fromIndex: pointCount - 1, toIndex: 0 },
        });
        const cam = useViewStore.getState();
        useViewStore.getState().setView(cam.offsetX - last.x, cam.offsetY - last.y, cam.scale);
      },
    }),
    { name: 'azimuth-ledger-route' },
  ),
);
