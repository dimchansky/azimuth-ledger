import { useState } from 'react';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { useRouteStore } from '../../store/routeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { normalizeAngle, milsToDegrees } from '../../domain/navigation';
import styles from './Sidebar.module.css';

/** Parse a numeric string, accepting both '.' and ',' as decimal separators. */
function parseNumber(raw: string): number {
  return parseFloat(raw.replace(',', '.'));
}

export function AddSegmentForm() {
  const addSegment = useRouteStore((s) => s.addSegment);
  const angleUnit = useSettingsStore((s) => s.angleUnit);
  const milsPerCircle = useSettingsStore((s) => s.milsPerCircle);

  const [azimuth, setAzimuth] = useState('');
  const [length, setLength] = useState('');
  const [label, setLabel] = useState('');
  const [error, setError] = useState('');

  const unitLabel = angleUnit === 'degrees' ? '°' : ' mil';
  const maxVal = angleUnit === 'degrees' ? 360 : milsPerCircle;

  const handleAdd = () => {
    setError('');

    const azVal = parseNumber(azimuth);
    const lenVal = parseNumber(length);

    if (isNaN(azVal) || azimuth.trim() === '') {
      setError(`Enter azimuth (0–${maxVal})`);
      return;
    }
    if (isNaN(lenVal) || length.trim() === '' || lenVal <= 0) {
      setError('Enter length > 0');
      return;
    }
    if (azVal < 0 || azVal >= maxVal) {
      setError(`Azimuth must be 0–${maxVal}${unitLabel}`);
      return;
    }

    // Convert to degrees if mils
    const azDeg =
      angleUnit === 'mils'
        ? normalizeAngle(milsToDegrees(azVal, milsPerCircle), 'degrees')
        : normalizeAngle(azVal, 'degrees');

    const pointLabel = label.trim();

    addSegment(azDeg, lenVal, pointLabel.slice(0, 20));

    setAzimuth('');
    setLength('');
    setLabel('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAdd();
  };

  const hasError = error !== '';

  return (
    <form className={styles.addForm} onSubmit={handleSubmit} aria-label="Add leg">
      <div className={styles.addFormRow}>
        <div className={styles.inputWrapper}>
          <VisuallyHidden.Root asChild>
            <label htmlFor="azimuth-input">Azimuth</label>
          </VisuallyHidden.Root>
          <input
            id="azimuth-input"
            type="text"
            inputMode="decimal"
            placeholder={`Azimuth (0–${maxVal})${unitLabel}`}
            value={azimuth}
            onChange={(e) => setAzimuth(e.target.value)}
            className={styles.input}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? 'add-segment-error' : undefined}
          />
        </div>
        <div className={styles.inputWrapper}>
          <VisuallyHidden.Root asChild>
            <label htmlFor="length-input">Length</label>
          </VisuallyHidden.Root>
          <input
            id="length-input"
            type="text"
            inputMode="decimal"
            placeholder="Length"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            className={styles.input}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? 'add-segment-error' : undefined}
          />
        </div>
      </div>
      <div className={styles.addFormRow}>
        <div className={styles.inputWrapper}>
          <VisuallyHidden.Root asChild>
            <label htmlFor="label-input">Label</label>
          </VisuallyHidden.Root>
          <input
            id="label-input"
            type="text"
            placeholder="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={20}
            className={styles.input}
          />
        </div>
        <button type="button" onClick={handleAdd} className={styles.btnPrimary}>
          Add
        </button>
      </div>
      {hasError && (
        <div id="add-segment-error" className={styles.formError} role="alert">
          {error}
        </div>
      )}
    </form>
  );
}
