import { useState, useEffect } from 'react';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { useRouteStore } from '../../store/routeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAddLegFormStore } from '../../store/addLegFormStore';
import { normalizeAngle, milsToDegrees, degreesToMils, formatNum } from '../../domain/navigation';
import styles from './Sidebar.module.css';

/** Parse a numeric string, accepting both '.' and ',' as decimal separators. */
function parseNumber(raw: string): number {
  return parseFloat(raw.replace(',', '.'));
}

export function AddSegmentForm() {
  const addSegment = useRouteStore((s) => s.addSegment);
  const angleUnit = useSettingsStore((s) => s.angleUnit);
  const milsPerCircle = useSettingsStore((s) => s.milsPerCircle);

  const azimuth = useAddLegFormStore((s) => s.azimuth);
  const length = useAddLegFormStore((s) => s.length);
  const label = useAddLegFormStore((s) => s.label);
  const lastAngleUnit = useAddLegFormStore((s) => s.lastAngleUnit);
  const setAzimuth = useAddLegFormStore((s) => s.setAzimuth);
  const setLength = useAddLegFormStore((s) => s.setLength);
  const setLabel = useAddLegFormStore((s) => s.setLabel);
  const setLastAngleUnit = useAddLegFormStore((s) => s.setLastAngleUnit);
  const clearForm = useAddLegFormStore((s) => s.clearForm);

  const [error, setError] = useState('');

  // Recalculate azimuth when angle unit changes
  useEffect(() => {
    if (angleUnit === lastAngleUnit) return;

    if (azimuth.trim() !== '') {
      const val = parseNumber(azimuth);
      if (!isNaN(val)) {
        if (lastAngleUnit === 'degrees' && angleUnit === 'mils') {
          setAzimuth(String(Math.round(degreesToMils(val, milsPerCircle))));
        } else if (lastAngleUnit === 'mils' && angleUnit === 'degrees') {
          setAzimuth(formatNum(milsToDegrees(val, milsPerCircle)));
        }
      }
    }

    setLastAngleUnit(angleUnit);
  }, [angleUnit, lastAngleUnit, azimuth, milsPerCircle, setAzimuth, setLastAngleUnit]);

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

    clearForm();
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
