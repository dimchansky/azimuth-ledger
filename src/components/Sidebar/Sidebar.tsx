import { AddSegmentForm } from './AddSegmentForm';
import { SegmentList } from './SegmentList';
import { SettingsPanel } from './SettingsPanel';
import { ActionBar } from './ActionBar';
import styles from './Sidebar.module.css';

export function Sidebar() {
  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <h1 className={styles.title}>Azimuth Ledger</h1>
      </div>
      <div className={styles.sectionHeader}>Add Leg</div>
      <AddSegmentForm />
      <ActionBar />
      <SegmentList />
      <SettingsPanel />
    </div>
  );
}
