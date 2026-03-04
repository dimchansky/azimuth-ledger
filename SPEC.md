# Azimuth Ledger — Functional Specification

## Overview

Azimuth Ledger is an offline-first PWA for dead-reckoning navigation. Users log a route as a sequence of vectors (magnetic azimuth + length) and visualize it as a 2D "virtual map" with North up.

## Coordinate System

- **North-up display:** Y-axis points North (up), X-axis points East (right).
- **Azimuth convention:** 0° = North, clockwise. Range: [0, 360) in degrees, [0, M) in mils.
- **Segment → coordinates:** Given a TRUE azimuth `θ` and length `L`:
  - `dx = L × sin(θ)`
  - `dy = L × cos(θ)`

## Magnetic vs True Azimuth

- **Primary input/output:** Magnetic azimuth (what you read on a compass).
- **Conversion:**
  - `true = magnetic + declination`
  - `magnetic = true - declination`
  - All results normalized to [0, 360).
- **Declination:** User-configurable float (can be negative). Stored in degrees.
- **Internal storage:** Segments store `magneticAzimuth` in degrees.

## Angle Units

- **Degrees:** [0, 360)
- **Mils:** [0, M) where M is configurable (default 6400).
- Changing M does NOT alter stored azimuths. Only affects display/input validation.
- Conversion: `mils = degrees × M / 360`, `degrees = mils × 360 / M`

## Domain Model

### Segment
- `id`: Unique identifier (`generateId()` — `Math.random().toString(36).slice(2)`)
- `magneticAzimuth`: Number in degrees [0, 360) — MAGNETIC
- `length`: Positive number (unitless)
- `label`: Destination point label, max 20 characters

### Point (derived)
- `index`: 0-based
- `x`, `y`: Computed coordinates
- `label`: From origin label or segment labels

### Selection
- `fromIndex`: Index of FROM point
- `toIndex`: Index of TO point
- Default: FROM = last point (Pn), TO = first point (P0)

## Display Convention

| Context | Primary (large/bold) | Secondary (small/dimmed) |
|---------|---------------------|------------------------|
| Selected leg card on map | MAG azimuth · length (selected units) | — |
| Selected leg row in sidebar | MAG azimuth · length (selected units) | TRUE azimuth (selected units) |
| FROM→TO vector label on map | MAG azimuth · distance (selected units) | — |
| FROM→TO info panel in sidebar | MAG azimuth · distance (selected units) | TRUE azimuth (selected units) |

The FROM→TO info panel header shows point badges with their names (if set).

## Map Selection

- **Tap a point** on the map to select it. The point gets a highlight ring and its row in the Route Log is scrolled into view. Tap the point label (underlined) to enter inline edit mode.
- **Tap a leg** on the map to select it. The leg thickens, a card appears at its midpoint, and its row in the Route Log is scrolled into view. Tap editable values (azimuth, length) to edit inline.
- **Tap empty space** to deselect.

## Route Operations

### Reverse Route
1. Reverse segment order.
2. For each segment, rotate azimuth +180° via TRUE azimuth:
   - `trueDeg = magneticToTrue(segment.magneticAzimuth, declination)`
   - `reversedTrue = normalizeDeg(trueDeg + 180)`
   - `reversedMag = trueToMagnetic(reversedTrue, declination)`
3. Reverse labels: `[originLabel, seg0.label, seg1.label, ...]` → new originLabel = old last label, etc.
4. After reverse: FROM defaults to new Pn, TO to new P0.

### Clear Route
- Reset to empty state (no segments, origin label reset to empty string).
- Reset `userHasInteracted` flag.

## Persistence

All state persisted to localStorage via Zustand `persist` middleware:
- Route: segments, origin label, selection (`azimuth-ledger-route`)
- Settings: declination, angle unit, mils-per-circle, grid step, units label (`azimuth-ledger-settings`)
- View: camera offset/scale (`azimuth-ledger-view`)

## UI Layout

- **Desktop (>768px):** Fixed 320px left sidebar + map canvas.
- **Mobile (≤768px):** Full-screen map with hamburger button (top-left). Sidebar opens as a Radix Dialog drawer from the left with focus trapping, ESC to close, and body scroll lock.

### UI Primitives (Radix UI)

- **Mobile drawer:** `@radix-ui/react-dialog` — focus trap, ESC, overlay dismiss, `aria-modal`
- **Confirm dialog:** `@radix-ui/react-alert-dialog` — focus trap, ESC, no click-outside dismiss (destructive action)
- **Settings panel:** `@radix-ui/react-collapsible` — `aria-expanded`, animated height via `--radix-collapsible-content-height`
- **Hidden labels:** `@radix-ui/react-visually-hidden` — accessible form labels

### Drawer Auto-Focus

- **Nothing selected on map:** auto-focus azimuth input (keyboard ready for new leg entry).
- **Point or leg selected on map:** auto-focus close button (no keyboard, selection visible in Route Log).

## Grid

- Lines every `gridStep` world units.
- Adaptive density at low zoom levels.
- Light gray, thin lines.

## Auto-fit Behavior

- On first segment add (or route has only P0), auto-fit map to show all points.
- Once user manually pans/zooms, set `userHasInteracted` → disable auto-fit on subsequent adds.
- "Fit to Route" button (bottom-right corner) always works (does NOT reset the flag).
- `clearRoute()` resets `userHasInteracted`.

## Deleting Segments — FROM/TO Clamping

- After deletion, clamp `selection.fromIndex` and `selection.toIndex` to `[0, newPointCount - 1]`.
- If both end up equal and there are ≥2 points, set `fromIndex = newPointCount - 1`, `toIndex = 0`.

## Label Constraints

- Max 20 characters.
- Default: empty string (point index shown in badge).
- Point labels are displayed on canvas as pills next to point badges.
