# N048

2048 with a base you pick, from 2 to 10. Two matching tiles merge into one
`base`× bigger, so base 3 goes 3 → 9 → 27 and base 10 goes 10 → 100 → 1,000.
Reach `base¹¹` to win.

**Play:** https://pradhanmantrielectionsgame.github.io/2048-base/

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
