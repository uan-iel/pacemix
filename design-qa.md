# PaceMix QQ Music Integration — Design QA

final result: passed

## Source visual truth

- QQ Music home: `/Users/m3max/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/wxid_r5fop4mlgmbp32_b2c5/temp/RWTemp/2026-10/9e20f478899dc29eb19741386f9343c8/17472dc7b8fe551151c98353b0a4b53f.jpg` (1260 × 2844 px).
- QQ Music song recognition: `/Users/m3max/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/wxid_r5fop4mlgmbp32_b2c5/temp/RWTemp/2026-10/9e20f478899dc29eb19741386f9343c8/d272b76147e98ba88ab9f6ae9f6d5e18.jpg` (1260 × 2844 px).
- QQ Music profile: `/Users/m3max/Library/Containers/com.tencent.xinWeChat/Data/Documents/xwechat_files/wxid_r5fop4mlgmbp32_b2c5/temp/RWTemp/2026-10/9e20f478899dc29eb19741386f9343c8/ca6e64276af5c7095d8e4a05a74cd86a.jpg` (1260 × 2844 px).
- PaceMix voice core remains grounded in `docs/design-source/selected-option-3-calm-voice-core.png`.

## Implementation evidence

- URL: `http://127.0.0.1:4173/`.
- Implementation screenshot: live Codex in-app Browser capture, tab 6, captured 2026-10-08. The Browser displayed the accepted capture but did not expose a stable local file path.
- Device content: iPhone runtime, 393 × 852 CSS px; reference images were evaluated at their original 1260 × 2844 density and normalized by composition rather than copied pixel-for-pixel.
- State: initial voice creation screen, followed by text-input mode and return to voice mode.

## Full-view comparison

- The surface now matches QQ Music's cool gray-blue background and white content-card hierarchy instead of the earlier warm standalone-app canvas.
- A compact back/title/more feature header replaces the standalone PaceMix navigation shell.
- The PaceMix particle microphone remains the unique functional identity, but its scale and glow are reduced so it no longer overwhelms the music content.
- Previous training and recommended playlists now enter the first viewport, matching QQ Music's denser content rhythm.
- A persistent white mini player with real cover art, title, artist, play, and next controls visually connects the feature to QQ Music.

## Focused comparison

- Typography: system/PingFang stack, black display text, smaller gray supporting text, and compact QQ-style header hierarchy are consistent with the references.
- Spacing: the header clears the Dynamic Island; the orb, previous-training card, and recommendation rail all remain visible in the initial viewport.
- Colors: `#f4f7fa` background, white cards, restrained borders/shadows, black text, and QQ green interaction states match the sampled visual direction.
- Images: real local song covers are used in the previous-training card, recommendation collage, and mini player. No placeholder cover art was introduced.
- Copy: `运动音乐`, `今天想怎么练？`, and the existing training copy remain product-specific and do not expose implementation or AI-system language.

## Iteration history

1. First integration placed the feature header underneath the Dynamic Island, hiding `运动音乐` (P1). The header moved to the protected content area and creation content was rebalanced below it.
2. The first mode-switch position sat too high above the mini player and obscured too much of the recommendation rail (P2). Its safe-area formula was reduced so it rests directly above the mini player.
3. The stable pass verified voice → text → voice transitions and confirmed the input card, fixed header, mini player, and safe area remain intact.

## Functional and accessibility checks

- Voice and text mode buttons remain exposed with distinct accessible names.
- Back, more, voice input, recommendation cards, and mini player remain semantic buttons.
- Text mode renders its keyboard-aware textarea and send button correctly.
- Reduced-motion handling for the particle field remains intact.
- Browser error and warning log was empty in the final pass.

## Automated verification

- `npm run check:runtime`: passed (28 protected runtime files).
- `npm run build`: passed (TypeScript and Vite production build).

## Remaining P3 polish

- The floating voice/text control intentionally overlaps the lower edge of the recommendation rail to remain reachable above the mini player. A future QQ Music-native pass could replace it with an inline text/voice action, but this was outside the four selected changes.

## Severity review

- P0: none.
- P1: none.
- P2: none.
