import { useCallback } from 'react';
import * as Collapsible from '@radix-ui/react-collapsible';
import { useSettingsStore } from '../../store/settingsStore';
import type { ThemePreference } from '../../store/settingsStore';
import { useNumericField } from '../../hooks/useNumericField';
import styles from './Sidebar.module.css';

const validatePositiveInt = (v: number) => Number.isInteger(v) && v > 0;
const validatePositive = (v: number) => isFinite(v) && v > 0;

export function SettingsPanel() {
  const declinationDeg = useSettingsStore((s) => s.declinationDeg);
  const angleUnit = useSettingsStore((s) => s.angleUnit);
  const milsPerCircle = useSettingsStore((s) => s.milsPerCircle);
  const gridStep = useSettingsStore((s) => s.gridStep);
  const unitsLabel = useSettingsStore((s) => s.unitsLabel);
  const themePreference = useSettingsStore((s) => s.themePreference);
  const setDeclinationDeg = useSettingsStore((s) => s.setDeclinationDeg);
  const setAngleUnit = useSettingsStore((s) => s.setAngleUnit);
  const setMilsPerCircle = useSettingsStore((s) => s.setMilsPerCircle);
  const setGridStep = useSettingsStore((s) => s.setGridStep);
  const setUnitsLabel = useSettingsStore((s) => s.setUnitsLabel);
  const setThemePreference = useSettingsStore((s) => s.setThemePreference);

  const formatMils = useCallback((v: number) => String(Math.round(v)), []);

  const declination = useNumericField({
    storeValue: declinationDeg,
    onCommit: setDeclinationDeg,
  });
  const mils = useNumericField({
    storeValue: milsPerCircle,
    onCommit: setMilsPerCircle,
    format: formatMils,
    validate: validatePositiveInt,
  });
  const grid = useNumericField({
    storeValue: gridStep,
    onCommit: setGridStep,
    validate: validatePositive,
  });

  return (
    <Collapsible.Root className={styles.settingsPanel}>
      <Collapsible.Trigger className={styles.settingsToggle}>
        Settings <span className={styles.settingsChevron}>▼</span>
      </Collapsible.Trigger>
      <Collapsible.Content className={styles.settingsContent}>
        <div className={styles.settingsBody}>
          <label className={styles.settingRow}>
            <span>Theme</span>
            <select
              value={themePreference}
              onChange={(e) => setThemePreference(e.target.value as ThemePreference)}
              className={styles.settingInput}
            >
              <option value="auto">Auto</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
          <label className={styles.settingRow}>
            <span>Declination (°)</span>
            <input
              {...declination.inputProps}
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
              {...mils.inputProps}
              className={styles.settingInput}
            />
          </label>
          <label className={styles.settingRow}>
            <span>Grid step</span>
            <input
              {...grid.inputProps}
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
