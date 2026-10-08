# PaceMix UI / Interaction QA

final result: passed

## Scope

- Selected direction: `docs/design-source/selected-option-3-calm-voice-core.png`.
- Implemented state: initial voice-first training creation at `http://127.0.0.1:4173/`.
- Reference source: 853 × 1844, normalized to 393 × 852 for comparison.
- Implementation source: default desktop preview with the iPhone runtime chrome retained, then the app viewport normalized to 393 × 852.
- Runtime behavior, plan generation, strict stage timing, cadence calibration, and playback logic were not replaced by the visual pass.

## Visual evidence

- Final implementation: `docs/qa/gradient-orb-implementation-final.png`.
- Full source-to-implementation comparison: `docs/qa/gradient-orb-comparison-final.png`.
- Focused voice-core comparison: `docs/qa/gradient-orb-focus-final.png`.
- Motion-state comparison: `docs/qa/orb-breath-cycle-comparison.png`.
- Focused recent-training and navigation comparison: `docs/qa/calm-voice-core-lower-focus.png`.
- Text-input keyboard safety-area check: `docs/qa/calm-text-keyboard-final.jpg`.
- Active-training check: `docs/qa/calm-session-pixel.png`.

## Comparison findings

- The visual hierarchy now follows the selected calm voice-core direction: one direct title, a restrained support line, one recognizable gradient microphone control, a compact previous-training row, and a quiet bottom switcher/navigation layer.
- All example sentences and example shortcut chips were intentionally removed in the latest requested state. The initial page now keeps an uninterrupted path from the voice control to previous training.
- The earlier generic AI cues were removed from visible creation copy. The interface no longer leads with a rainbow gradient, repeated prompt barrage, glowing assistant identity, or chatbot-style framing.
- The implemented microphone remains tap-to-talk because that is the real interaction contract; the selected reference's hold-to-talk label was intentionally not copied.
- Previous-training values are live saved product data, so they intentionally differ from the static numbers shown in the visual reference.
- iPhone status, Dynamic Island, home indicator, and the runtime close control remain visible because they are part of the protected device runtime rather than app UI.

## Iteration history

1. The first pass placed the title and core too high, used an undersized voice control, and clipped the speed summary. Padding, orb scale, and the previous-training grid were corrected.
2. Text focus did not reliably reveal the simulated keyboard and navigation could compete with the keyboard layer. Textarea clicks now explicitly open the keyboard; navigation sits behind the keyboard while the mode switch remains usable above it.
3. The first coded voice core was a flat green disc and its generated particle canvas drifted visibly to one side. Both were replaced with the centered gradient-orb asset extracted from the selected P2 visual.
4. The first gradient-orb integration mistakenly placed a second microphone over the microphone already present in the source asset, producing a doubled, distorted silhouette. The overlay was removed; the final evidence shows the original P2 microphone and sound bars intact.
5. The static orb asset was separated into a stable core layer and an independent outer-particle layer. The particle layer now expands from 96.5% to 107.5%, rotates less than one degree, and changes opacity on a regular 5.2-second cycle; listening mode uses a 2.6-second cycle. Reduced-motion users receive a static equivalent.

## Functional checks

- Voice and text modes switch without losing the creation state.
- Text input opens the simulated iOS keyboard without scrolling or displacing the app viewport.
- No initial example sentence or example shortcut remains in either voice or text mode; text mode exposes only the neutral placeholder `输入你的今日训练计划`.
- Computed transforms and opacity were sampled at the contracted and expanded points to confirm that the particle layer moves independently from the core without layout movement.
- A complete request can progress through understood requirements, strict SPM plan generation, plan preview, and training playback.
- SPM remains cadence; track BPM remains music tempo. Stage boundaries remain absolute and tracks are cut at the boundary.
- The only stage-transition warning remains the required audible and visual 5 → 0 countdown.
- Browser console error log was empty during the final pass.

## Automated verification

- `npm run check:runtime`: passed (28 protected runtime files).
- `npm run build`: passed (TypeScript and Vite production build).
- `npm run test:sites`: passed (4/4 tests).
- Local preview remained available at port 4173.

## Severity review

- P0: none.
- P1: none.
- P2: none.
- Accepted differences: protected runtime chrome, live local training data, and tap-to-talk wording.
