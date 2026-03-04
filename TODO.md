# Azimuth Ledger — Implementation Checklist

## Setup
- [x] Scaffold Vite + React + TS project
- [x] Docker setup: Dockerfile, Makefile, .dockerignore
- [x] Git init + .gitignore

## Domain Layer
- [x] Domain types (`domain/types.ts`) + `generateId` utility
- [x] Navigation math (`domain/navigation.ts`)
- [x] Navigation math unit tests
- [x] Route operations (`domain/route.ts`)
- [x] Route operations unit tests

## State Management
- [x] Route store (`store/routeStore.ts`) — persist to localStorage
- [x] Settings store (`store/settingsStore.ts`) — persist to localStorage
- [x] View store (`store/viewStore.ts`) — persist to localStorage
- [x] Map selection store (`store/mapSelectionStore.ts`)

## Map View
- [x] Camera module (`MapView/camera.ts`)
- [x] Canvas renderer (`MapView/renderer.ts`) — grid, route, labels, vector, north arrow
- [x] Gesture hook (`MapView/useCanvasInteraction.ts`)
- [x] MapView component (`MapView/MapView.tsx`)
- [x] Tap-to-select points and legs on map
- [x] Point labels on canvas (background pills)
- [x] Fit-to-route button (bottom-right corner)

## Sidebar
- [x] AddSegmentForm — accessible labels (VisuallyHidden), aria-invalid, role="alert" errors
- [x] SegmentList + RouteEntry (inline edit, FROM/TO chips, delete with confirm)
- [x] Direct Vector info panel with point names
- [x] SettingsPanel — Radix Collapsible with animated height and chevron
- [x] ActionBar (Clear with Radix AlertDialog confirm, Reverse)
- [x] Sidebar container

## App Shell
- [x] App layout (`App.tsx`, `App.module.css`, `global.css`)
- [x] useMediaQuery hook
- [x] Mobile drawer — Radix Dialog with focus trap, ESC, overlay dismiss, scroll lock
- [x] Smart auto-focus: azimuth input when nothing selected, close button when point/leg selected
- [x] ConfirmDialog component — Radix AlertDialog
- [x] Theme colors (`theme/colors.ts`)

## PWA & Deploy
- [x] PWA icons + manifest
- [x] `index.html` meta tags
- [x] GitHub Actions deploy workflow
- [x] README.md
