# N048

Shared rules for every game live one level up in `Samits-Games/CLAUDE.md` and are
inherited automatically. Only game-specific facts belong in this file.

## What this game is

2048, except the player picks the base: 2 through 10. Two equal tiles `v` merge
into `v * base`, so tiles are always powers of the chosen base.

## Rules that aren't obvious from the code

- The win tile is `base ** 11` at every base — 2048 at base 2, 100 billion at
  base 10. The exponent is what makes the game hard, not the digits, so the
  difficulty is identical across bases and the goal number is displayed in full.
- Tile colour is derived from the exponent (`hue = exp * 36`), not a lookup
  table, because a base-10 game reaches exponent 11 with 12-digit labels.
- Tile labels above 100,000 use compact notation (`100K`); the goal in the header
  never does. A 12-digit number does not fit an 81px tile.

## Gotchas

- `busy` blocks input during the 110ms slide animation. Without it, fast swipes
  interleave with the post-move timeout and tiles get orphaned.
- Board cell size is computed in JS (`--cs`) from the board's real width via a
  ResizeObserver — CSS can't express "quarter of the padding box minus 3 gaps"
  cleanly, and the observer covers rotation and the mobile address bar.
