import { useRef, useEffect, useState } from 'react';
import type { Segment, AngleUnit } from '../../domain/types';
import { useRouteStore } from '../../store/routeStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useMapSelectionStore } from '../../store/mapSelectionStore';
import { computePoints, computeVector, degreesToMils, magneticToTrue, milsToDegrees, normalizeAngle } from '../../domain/navigation';
import { getPointColor } from '../../theme/colors';
import styles from './Sidebar.module.css';

function formatNum(n: number): string {
  const s = n.toFixed(1);
  return s.endsWith('.0') ? s.slice(0, -2) : s;
}

function formatAz(deg: number, unit: AngleUnit, M: number): string {
  if (unit === 'mils') return `${Math.round(degreesToMils(deg, M))} mil`;
  return `${formatNum(deg)}\u00B0`;
}

interface RouteEntryProps {
  pointIndex: number;
  pointLabel: string;
  onPointLabelChange: (label: string) => void;
  outgoingSegment: Segment | null;
  outgoingSegmentIndex: number | null;
}

function RouteEntry({
  pointIndex,
  pointLabel,
  onPointLabelChange,
  outgoingSegment,
  outgoingSegmentIndex,
}: RouteEntryProps) {
  const selection = useRouteStore((s) => s.selection);
  const setSelection = useRouteStore((s) => s.setSelection);
  const updateSegment = useRouteStore((s) => s.updateSegment);
  const deleteSegment = useRouteStore((s) => s.deleteSegment);
  const angleUnit = useSettingsStore((s) => s.angleUnit);
  const milsPerCircle = useSettingsStore((s) => s.milsPerCircle);
  const declinationDeg = useSettingsStore((s) => s.declinationDeg);
  const unitsLabel = useSettingsStore((s) => s.unitsLabel);
  const mapSelection = useMapSelectionStore((s) => s.mapSelection);
  const setMapSelection = useMapSelectionStore((s) => s.setMapSelection);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);

  const isPointSelected = mapSelection?.type === 'point' && mapSelection.index === pointIndex;
  const isLegSelected = outgoingSegmentIndex !== null && mapSelection?.type === 'leg' && mapSelection.index === outgoingSegmentIndex;

  const badgeColor = getPointColor(pointIndex, selection);
  const isFromActive = selection.fromIndex === pointIndex;
  const isToActive = selection.toIndex === pointIndex;

  // Reset editing/confirm when leg deselected
  useEffect(() => {
    if (!isLegSelected) {
      setEditingField(null);
      setConfirmDelete(false);
    }
  }, [isLegSelected]);

  // Reset label editing when point deselected
  useEffect(() => {
    if (!isPointSelected) {
      setEditingLabel(false);
    }
  }, [isPointSelected]);

  // Auto-focus label input when entering edit mode
  useEffect(() => {
    if (editingLabel && labelInputRef.current) {
      labelInputRef.current.focus();
    }
  }, [editingLabel]);

  const togglePoint = () => {
    if (isPointSelected) {
      setMapSelection(null);
    } else {
      setMapSelection({ type: 'point', index: pointIndex });
    }
  };

  const toggleLeg = () => {
    if (outgoingSegmentIndex === null) return;
    if (isLegSelected) {
      setMapSelection(null);
    } else {
      setMapSelection({ type: 'leg', index: outgoingSegmentIndex });
    }
  };

  // Inline editing for leg values
  const startEdit = (field: string, value: string) => {
    setEditingField(field);
    setEditValue(value);
  };

  const commitEdit = () => {
    if (!editingField || !outgoingSegment) return;

    if (editingField === 'azimuth') {
      const val = parseFloat(editValue);
      if (!isNaN(val)) {
        const deg = angleUnit === 'mils'
          ? normalizeAngle(milsToDegrees(val, milsPerCircle), 'degrees')
          : normalizeAngle(val, 'degrees');
        updateSegment(outgoingSegment.id, { magneticAzimuth: deg });
      }
    } else if (editingField === 'length') {
      const val = parseFloat(editValue);
      if (!isNaN(val) && val > 0) {
        updateSegment(outgoingSegment.id, { length: val });
      }
    }

    setEditingField(null);
  };

  const cancelEdit = () => setEditingField(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit();
    if (e.key === 'Escape') cancelEdit();
  };

  const handleDelete = () => {
    if (!outgoingSegment) return;
    if (confirmDelete) {
      deleteSegment(outgoingSegment.id);
    } else {
      setConfirmDelete(true);
    }
  };

  // Compute leg display values
  const trueAz = outgoingSegment ? magneticToTrue(outgoingSegment.magneticAzimuth, declinationDeg) : 0;
  const magStr = outgoingSegment ? formatAz(outgoingSegment.magneticAzimuth, angleUnit, milsPerCircle) : '';
  const trueStr = outgoingSegment ? formatAz(trueAz, angleUnit, milsPerCircle) : '';

  return (
    <div className={styles.routeEntry}>
      {/* Point header */}
      <div
        className={`${styles.entryHeader} ${isPointSelected ? styles.entryHeaderSelected : ''}`}
        data-map-point={pointIndex}
        role="button"
        tabIndex={0}
        onClick={togglePoint}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            togglePoint();
          }
        }}
      >
        {isPointSelected && <span className={styles.selectionTag}>POINT</span>}
        <span className={styles.pointBadge} style={{ background: badgeColor }}
          onClick={isPointSelected ? (e) => e.stopPropagation() : undefined}>
          {pointIndex}
        </span>

        {isPointSelected && editingLabel ? (
          <input
            ref={labelInputRef}
            className={styles.entryLabelInput}
            value={pointLabel}
            onChange={(e) => onPointLabelChange(e.target.value.slice(0, 20))}
            onBlur={() => setEditingLabel(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'Escape') setEditingLabel(false);
            }}
            maxLength={20}
            placeholder="name"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={`${styles.entryLabel} ${isPointSelected ? styles.entryLabelEditable : ''}`}
            onClick={(e) => {
              if (!isPointSelected) return;
              e.stopPropagation();
              setEditingLabel(true);
            }}
          >
            {pointLabel || (isPointSelected ? '\u00A0' : '')}
          </span>
        )}

        <div className={styles.chipGroup} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className={`${styles.chip} ${isFromActive ? styles.chipFromActive : styles.chipFromInactive}`}
            aria-pressed={isFromActive}
            onClick={() => {
              if (isToActive) {
                setSelection({ fromIndex: pointIndex, toIndex: selection.fromIndex });
              } else {
                setSelection({ ...selection, fromIndex: pointIndex });
              }
            }}
          >
            FROM
          </button>
          <button
            type="button"
            className={`${styles.chip} ${isToActive ? styles.chipToActive : styles.chipToInactive}`}
            aria-pressed={isToActive}
            onClick={() => {
              if (isFromActive) {
                setSelection({ fromIndex: selection.toIndex, toIndex: pointIndex });
              } else {
                setSelection({ ...selection, toIndex: pointIndex });
              }
            }}
          >
            TO
          </button>
        </div>
      </div>

      {/* Outgoing leg */}
      {outgoingSegment && outgoingSegmentIndex !== null && (
        <div
          className={`${styles.entryLeg} ${isLegSelected ? styles.entryLegSelected : ''}`}
          data-map-leg={outgoingSegmentIndex}
          role="button"
          tabIndex={0}
          onClick={toggleLeg}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleLeg();
            }
          }}
        >
          {isLegSelected && <span className={`${styles.selectionTag} ${styles.selectionTagLeg}`}>LEG</span>}
          <div className={styles.legConnector}>
            <div className={styles.legConnectorLine} />
            <div className={styles.legConnectorArrow} />
          </div>
          <div className={styles.legContent} onClick={isLegSelected ? (e) => e.stopPropagation() : undefined}>
            <div className={styles.legPrimary}>
              {/* MAG value */}
              {editingField === 'azimuth' ? (
                <input
                  className={styles.legInlineInput}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={handleKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  type="number"
                  step="any"
                  autoFocus
                />
              ) : (
                <span
                  className={isLegSelected ? styles.legEditable : undefined}
                  onClick={(e) => {
                    if (!isLegSelected) return;
                    e.stopPropagation();
                    const displayVal = angleUnit === 'mils'
                      ? String(Math.round(degreesToMils(outgoingSegment.magneticAzimuth, milsPerCircle)))
                      : outgoingSegment.magneticAzimuth.toFixed(1);
                    startEdit('azimuth', displayVal);
                  }}
                >
                  MAG {magStr}
                </span>
              )}

              <span> &middot; </span>

              {/* Length value */}
              {editingField === 'length' ? (
                <input
                  className={styles.legInlineInput}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={handleKeyDown}
                  onClick={(e) => e.stopPropagation()}
                  type="number"
                  step="any"
                  min="0"
                  autoFocus
                />
              ) : (
                <span
                  className={isLegSelected ? styles.legEditable : undefined}
                  onClick={(e) => {
                    if (!isLegSelected) return;
                    e.stopPropagation();
                    startEdit('length', String(outgoingSegment.length));
                  }}
                >
                  L {outgoingSegment.length}{unitsLabel ? `\u2009${unitsLabel}` : ''}
                </span>
              )}
            </div>

            {/* TRUE — only when leg selected */}
            {isLegSelected && (
              <div className={styles.legSecondary}>TRUE {trueStr}</div>
            )}
          </div>

          {/* Delete button — direct child of entryLeg for vertical centering */}
          {isLegSelected && (
            confirmDelete ? (
              <button
                className={styles.legDeleteConfirm}
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              >
                Delete?
              </button>
            ) : (
              <button
                className={styles.legDeleteBtn}
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                title="Delete segment"
              >
                &#10005;
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export function SegmentList() {
  const segments = useRouteStore((s) => s.segments);
  const originLabel = useRouteStore((s) => s.originLabel);
  const selection = useRouteStore((s) => s.selection);
  const setOriginLabel = useRouteStore((s) => s.setOriginLabel);
  const updateSegment = useRouteStore((s) => s.updateSegment);
  const declinationDeg = useSettingsStore((s) => s.declinationDeg);
  const milsPerCircle = useSettingsStore((s) => s.milsPerCircle);
  const angleUnit = useSettingsStore((s) => s.angleUnit);
  const unitsLabel = useSettingsStore((s) => s.unitsLabel);

  const mapSelection = useMapSelectionStore((s) => s.mapSelection);
  const listRef = useRef<HTMLDivElement>(null);

  const points = computePoints(segments, originLabel, declinationDeg);

  // FROM->TO info
  const from = points[selection.fromIndex];
  const to = points[selection.toIndex];
  const vec = from && to && selection.fromIndex !== selection.toIndex
    ? computeVector(from, to, declinationDeg)
    : null;

  // Auto-scroll to selected item
  useEffect(() => {
    if (!mapSelection || !listRef.current) return;
    const attr = mapSelection.type === 'point'
      ? `[data-map-point="${mapSelection.index}"]`
      : `[data-map-leg="${mapSelection.index}"]`;
    const el = listRef.current.querySelector(attr);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [mapSelection]);

  return (
    <div className={styles.segmentList} ref={listRef}>
      {/* FROM->TO info panel (sticky) */}
      {vec && (
        <div className={styles.vectorSection}>
          <div className={styles.sectionHeader}>Direct Vector</div>
          <div className={styles.vectorInfo}>
            <div className={styles.vectorHeader}>
              <span className={styles.pointBadgeSm} style={{ background: 'var(--from-color)' }}>{selection.fromIndex}</span>
              {from.label && <span className={styles.vectorPointLabel}>{from.label}</span>}
              <span className={styles.vectorArrow}>&rarr;</span>
              <span className={styles.pointBadgeSm} style={{ background: 'var(--to-color)' }}>{selection.toIndex}</span>
              {to.label && <span className={styles.vectorPointLabel}>{to.label}</span>}
            </div>
            <div className={styles.vectorPrimary}>
              MAG {formatAz(vec.magneticAz, angleUnit, milsPerCircle)} &middot; {formatNum(vec.distance)}{unitsLabel ? `\u2009${unitsLabel}` : ''}
            </div>
            <div className={styles.vectorSecondary}>
              TRUE {formatAz(vec.trueAz, angleUnit, milsPerCircle)}
            </div>
          </div>
        </div>
      )}

      <div className={styles.sectionHeader}>Route Log</div>
      <div className={styles.routeHint}>Each row: point + leg to next</div>

      {/* Entry 0: origin point + segment 0 (if exists) */}
      <RouteEntry
        key="entry-0"
        pointIndex={0}
        pointLabel={originLabel}
        onPointLabelChange={setOriginLabel}
        outgoingSegment={segments[0] ?? null}
        outgoingSegmentIndex={segments.length > 0 ? 0 : null}
      />

      {/* Entries 1..N via segments.map */}
      {segments.map((seg, i) => (
        <RouteEntry
          key={seg.id}
          pointIndex={i + 1}
          pointLabel={seg.label}
          onPointLabelChange={(label) => updateSegment(seg.id, { label })}
          outgoingSegment={segments[i + 1] ?? null}
          outgoingSegmentIndex={i + 1 < segments.length ? i + 1 : null}
        />
      ))}

      {segments.length === 0 && (
        <div className={styles.emptyState}>
          Add a segment to start your route.
        </div>
      )}
    </div>
  );
}
