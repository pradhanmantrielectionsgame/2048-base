# N048

2048 with a base you pick, from 2 to 10. Two matching tiles merge into one
`base`× bigger, so base 3 goes 3 → 9 → 27 and base 10 goes 10 → 100 → 1,000.
Reach `base¹¹` to win.

**Play:** https://pradhanmantrielectionsgame.github.io/2048-base/

## Features

- **Any base:** Pick bases 2–10; difficulty stays the same, only notation changes.
- **Per-base saves:** Each base keeps its own in-progress game. Old saves are migrated on load.
- **Fraction labels:** Toggle to show tile values as fractions (8 → 1/8, 2048 → 1/2048). Rules unchanged.
- **Installable PWA:** Add to Home Screen on iOS or install on Android. Works offline.

## Develop

```bash
npm run dev        # serve + LAN URL + cloudflared tunnel, both with QR codes
npm test           # logic self-checks
npm run release patch --push   # cut a version and deploy
```

No build step, no dependencies.

- `src/logic.mjs` — pure rules (collapse, isStuck, spawnValue). Tested by `src/logic.test.mjs`.
- `src/game.mjs` — DOM glue, animation, persistence.
- `src/kit.mjs` — shared input/storage/sound/share helpers.
