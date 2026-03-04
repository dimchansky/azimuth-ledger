# Azimuth Ledger

Offline-first PWA for dead-reckoning navigation: log a route as magnetic azimuth + length vectors and visualize it as a 2D map with North up.

## Features

- Record route legs with magnetic azimuth and length
- Real-time 2D map with pan, zoom, and pinch gestures
- Tap to select points and legs on the map; inline editing of values
- Point labels displayed on canvas next to badges
- FROM→TO vector: select any two points to see direct azimuth and distance
- Reverse route, clear route, fit-to-route
- Magnetic ↔ True azimuth conversion with configurable declination
- Degrees and mils (configurable mils-per-circle) angle units
- Configurable grid step and units label
- Accessible UI: Radix UI primitives (Dialog, AlertDialog, Collapsible) with focus trapping, keyboard navigation, and ARIA roles
- Offline: works without network after first load (PWA)
- Dark mode support

## Prerequisites

**Docker (primary)** — no global Node install required.

Or **Node 22+** as a fallback.

## Development

### Docker workflow (primary)

```bash
make dev       # Start Vite dev server on http://localhost:5173/
make test      # Run unit tests
make build     # Produce dist/ for deployment
make clean     # Remove dist/ and Docker artifacts
```

### Non-Docker fallback

```bash
npm install
npm run dev        # Dev server
npm test           # Unit tests
npm run build      # Production build
```

## Deploy

Automatic via GitHub Actions on push to `main`. Configure your repo:

1. Settings → Pages → Source: **GitHub Actions**
2. Push to `main` — the workflow runs tests, builds, and deploys

Live at: `https://dimchansky.github.io/azimuth-ledger/`

## Offline / PWA

Once loaded, the app works offline. On iOS: Safari → Share → "Add to Home Screen".
