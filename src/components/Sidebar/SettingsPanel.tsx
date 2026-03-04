import * as Collapsible from '@radix-ui/react-collapsible';
import { useSettingsStore } from '../../store/settingsStore';
import styles from './Sidebar.module.css';

export function SettingsPanel() {
  const declinationDeg = useSettingsStore((s) => s.declinationDeg);
  const angleUnit = useSettingsStore((s) => s.angleUnit);
  const milsPerCircle = useSettingsStore((s) => s.milsPerCircle);
  const gridStep = useSettingsStore((s) => s.gridStep);
  const unitsLabel = useSettingsStore((s) => s.unitsLabel);
  const setDeclinationDeg = useSettingsStore((s) => s.setDeclinationDeg);
  const setAngleUnit = useSettingsStore((s) => s.setAngleUnit);
  const setMilsPerCircle = useSettingsStore((s) => s.setMilsPerCircle);
  const setGridStep = useSettingsStore((s) => s.setGridStep);
  const setUnitsLabel = useSettingsStore((s) => s.setUnitsLabel);

  return (
    <Collapsible.Root className={styles.settingsPanel}>
      <Collapsible.Trigger className={styles.settingsToggle}>
        Settings <span className={styles.settingsChevron}>▼</span>
      </Collapsible.Trigger>
      <Collapsible.Content className={styles.settingsContent}>
        <div className={styles.settingsBody}>
          <label className={styles.settingRow}>
            <span>Declination (°)</span>
            <input
              type="number"
              value={declinationDeg}
              onChange={(e) => setDeclinationDeg(parseFloat(e.target.value) || 0)}
              step="0.1"
              className={styles.settingInput}
            />
          </label>
          <label className={styles.settingRow}>
            <span>Azimuth input</span>
            <select
              value={angleUnit}
              onChange={(e) => setAngleUnit(e.target.value as 'degrees' | 'mils')}
              className={styles.settingInput}
            >
              <option value="degrees">Degrees</option>
              <option value="mils">Mils</option>
            </select>
          </label>
          <label className={styles.settingRow}>
            <span>Mils per circle</span>
            <input
              type="number"
              value={milsPerCircle}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                if (v > 0) setMilsPerCircle(v);
              }}
              className={styles.settingInput}
            />
          </label>
          <label className={styles.settingRow}>
            <span>Grid step</span>
            <input
              type="number"
              value={gridStep}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (v > 0) setGridStep(v);
              }}
              step="any"
              min="1"
              className={styles.settingInput}
            />
          </label>
          <label className={styles.settingRow}>
            <span>Units label</span>
            <input
              type="text"
              value={unitsLabel}
              onChange={(e) => setUnitsLabel(e.target.value)}
              placeholder="e.g. steps, m"
              className={styles.settingInput}
            />
          </label>
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
