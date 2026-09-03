# N048

2048 with a base you pick, from 2 to 10.

**Play:** https://pradhanmantrielectionsgame.github.io/2048-base/

## Develop

```bash
npm run dev        # serve + LAN URL + cloudflared tunnel, both with QR codes
npm test           # run the logic self-checks
npm run release patch --push   # cut a version and deploy
```

No build step, no dependencies. `index.html` loads `src/game.mjs` directly.

- `src/logic.mjs` — pure rules, no DOM. Tested by `src/logic.test.mjs`.
- `src/game.mjs` — DOM glue.
- `src/kit.mjs` — shared input/storage/sound/share helpers (a copy, edit freely).
