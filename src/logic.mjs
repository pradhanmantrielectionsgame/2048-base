/**
 * Pure rules for N048 — classic 2048 with a configurable base.
 *
 * Tiles are powers of `base`: two equal tiles v merge into v * base. Everything
 * else (spawn odds, 4×4 grid, win at base^11) matches the original game.
 * No DOM here — see logic.test.mjs.
 */

export const SIZE = 4;
export const WIN_EXP = 11;          // base 2 -> 2048, same difficulty at any base

/** Cell [row, col] at position i of line k, per swipe direction. */
export const cellsOf = {
  left:  (k, i) => [k, i],
  right: (k, i) => [k, SIZE - 1 - i],
  up:    (k, i) => [i, k],
  down:  (k, i) => [SIZE - 1 - i, k],
};

/**
 * Collapse one line of tile values (in traversal order) into move/merge ops.
 * @param {(number|null)[]} line values, null for empty cells
 * @param {number} base two equal tiles v merge into v * base
 * @returns {{ops: {from: number[], to: number, val: number}[], gained: number}}
 *   `from` holds one source index for a plain slide, two for a merge.
 */
export function collapse(line, base) {
  const src = line.map((v, i) => ({v, i})).filter(x => x.v != null);
  const ops = [];
  let gained = 0, out = 0;
  for (let i = 0; i < src.length; i++) {
    if (i + 1 < src.length && src[i].v === src[i + 1].v) {
      const val = src[i].v * base;
      ops.push({from: [src[i].i, src[i + 1].i], to: out++, val});
      gained += val;
      i++;                          // a merged tile can't merge again this move
    } else {
      ops.push({from: [src[i].i], to: out++, val: src[i].v});
    }
  }
  return {ops, gained};
}

/** True when the ops actually change the board. */
export const movesBoard = ops => ops.some(o => o.from.length > 1 || o.from[0] !== o.to);

/**
 * Game over: board full and no two neighbours match.
 * @param {(number|null)[][]} grid SIZE×SIZE of values
 */
export function isStuck(grid) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c];
      if (v == null) return false;
      if (c + 1 < SIZE && grid[r][c + 1] === v) return false;
      if (r + 1 < SIZE && grid[r + 1][c] === v) return false;
    }
  }
  return true;
}

/** A newly spawned tile: base, or base² one time in ten. */
export const spawnValue = (base, rand = Math.random) => rand() < .9 ? base : base * base;
