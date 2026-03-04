import { useState } from 'react';
import { useRouteStore } from '../../store/routeStore';
import { useMapSelectionStore } from '../../store/mapSelectionStore';
import { ConfirmDialog } from '../common/ConfirmDialog';
import styles from './Sidebar.module.css';

export function ActionBar() {
  const [showConfirm, setShowConfirm] = useState(false);
  const clearRoute = useRouteStore((s) => s.clearRoute);
  const reverseRoute = useRouteStore((s) => s.reverseRoute);
  const segments = useRouteStore((s) => s.segments);

  const handleReverse = () => {
    const n = segments.length;
    const mapSelection = useMapSelectionStore.getState().mapSelection;
    reverseRoute();
    if (mapSelection) {
      const { type, index } = mapSelection;
      const newIndex = type === 'point' ? n - index : n - 1 - index;
      useMapSelectionStore.getState().setMapSelection({ type, index: newIndex });
    }
  };

  return (
    <>
      <div className={styles.sectionHeader}>Route</div>
      <div className={styles.actionBar}>
        <button className={styles.btn} onClick={handleReverse} disabled={segments.length === 0}>
          Reverse
        </button>
        <button
          className={styles.btnDanger}
          onClick={() => setShowConfirm(true)}
          disabled={segments.length === 0}
        >
          Clear
        </button>
      </div>
      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Clear Route"
        description="Clear the entire route? This cannot be undone."
        confirmLabel="Clear"
        onConfirm={() => { clearRoute(); setShowConfirm(false); }}
      />
    </>
  );
}
