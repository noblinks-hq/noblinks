# Slideshow Controls — Implementation Plan

## Status
**TODO** — Slideshow auto-advances but has no pause, manual navigation, or keyboard controls.

## Problem
Users cannot pause the slideshow on a specific dashboard or navigate manually. If a dashboard is interesting, they can't stay on it.

## What to Build

### Pause / Play
- Floating overlay (bottom-center) shows a pause button during auto-play
- Click pause → stops auto-advance, button becomes play
- Click play → resumes

### Manual navigation
- Left `‹` and right `›` arrow buttons in the overlay
- Navigate to prev/next dashboard immediately (resets timer if playing)

### Keyboard shortcuts
- `Space` → toggle pause/play
- `ArrowLeft` → previous dashboard
- `ArrowRight` → next dashboard
- `Escape` → exit slideshow

### Pause on hover
- When mouse enters the overlay area → pause auto-advance
- When mouse leaves → resume (if was playing)

### Progress indicator
- Replace or supplement the current progress bar with dots (one per dashboard)
- Active dot is highlighted

## Files
- `src/components/product/slideshow-view.tsx` — all changes here

## Implementation notes
- Store `isPaused` state, skip `setInterval` tick when true
- Keyboard events: `useEffect` with `addEventListener("keydown", ...)` on mount
