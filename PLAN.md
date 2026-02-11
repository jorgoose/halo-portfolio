# Halo Portfolio Audit — Implementation Plan

## Phase 1: Critical Memory Leaks & Crashes (Bugs that actively degrade user experience)

### 1.1 Fix all memory leaks in radio widget lifecycle
- Store `speakerInterval` at component scope so it can be cleared on toggle-off and unmount
- Store `fadeOutTimer`/`fadeInTimer` at component scope; clear them in `stopVisualization()` and on unmount
- Fix home page `onMount` cleanup to close `audioContext`, cancel `animationFrame`, pause `audioElement`
- Ensure sub-pages call `audioElement.pause()` when collapsing radio
- Guard `AudioContext` creation: reuse existing context if open, or close before creating new

### 1.2 Fix video event listener stacking
- Use named handler functions and remove them in cleanup, or use `{ once: true }` where appropriate

### 1.3 Remove unused Three.js dependency
- Remove `three` from dependencies and `@types/three` from devDependencies in package.json

## Phase 2: High-Priority Performance & UX Fixes

### 2.1 Replace setInterval fade animation with CSS transitions
- Change speaker image opacity to use a CSS class toggle with `transition: opacity 0.2s ease`
- Remove the manual `setInterval`-based `transitionToSpeaker` function entirely

### 2.2 Batch canvas draw calls
- Move `beginPath()`, `strokeStyle`, `lineWidth`, `lineCap` outside the loop
- Use a single `stroke()` after the loop (128 → 1 draw call per frame)

### 2.3 Fix navigation bugs
- Add keyboard arrow-key navigation to home page menu
- Replace `history.back()` with explicit `goto('/')` or `<a href="/">` on all Back buttons
- Add `on:keydown` handlers for Enter/Space on Back buttons and radio widget

### 2.4 Fix global CSS leaks
- Move `html, body` styles to `app.css` (the single global stylesheet) instead of per-page scoped styles
- Replace `100vw` with `100%` where causing horizontal scrollbar

### 2.5 Fix font loading
- Add `<link rel="preconnect">` for fonts.cdnfonts.com
- Add `font-display: swap` via `@font-face` overrides in app.css

### 2.6 Add video `preload="none"` on sub-pages
- Sub-pages should not eagerly load the 29MB video; add `preload="metadata"` at minimum

## Phase 3: Medium-Priority Polish

### 3.1 Fix CSS inconsistencies
- Fix `.radio-pulse` to be circular (60x60 not 70x60)
- Change `transition: all` to `transition: width 0.5s, height 0.5s, border-color 0.5s` on radio widget
- Remove invisible `text-shadow` from `.halo-title`
- Normalize projects page header margin to match other pages

### 3.2 Fix accessibility issues
- Change `role="button" aria-selected` to `role="option"` inside a `role="listbox"` container
- Add `aria-pressed` to CRT toggle button
- Add `aria-live="polite"` region for content area changes

### 3.3 Fix state/reactivity issues
- Fix `$:` reactive statement inside `onMount` on projects page
- Remove redundant `typeof window` checks inside `onMount`

## Phase 4: Low-Priority Cleanup

### 4.1 Code quality cleanup
- Remove all `console.log` debug statements
- Remove unused `onDestroy` imports
- Remove unused `old_voice_run_ex.mp3` from static/
- Fix duplicate CSS rule definitions within about page
