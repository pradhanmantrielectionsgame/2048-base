import test from 'node:test';
import assert from 'node:assert/strict';
import {collapse, movesBoard, isStuck, spawnValue} from './logic.mjs';

const vals = line => collapse(line, 2).ops.map(o => o.val);

test('merging', () => {
  assert.deepEqual(vals([2, 2, null, 4]), [4, 4], 'one pair merges, gap closes');
  assert.deepEqual(vals([2, 2, 2, 2]), [4, 4], 'two independent merges');
  assert.deepEqual(vals([2, 2, 4, null]), [4, 4], 'a merged tile does not merge again');
  assert.deepEqual(vals([4, 2, 2, null]), [4, 4], 'merge happens at the far end first');
  assert.equal(collapse([null, 2, null, 2], 2).ops[0].from.length, 2, 'merges across gaps');
});

test('scoring is the value created', () => {
  assert.equal(collapse([2, 2, null, 4], 2).gained, 4);
  assert.equal(collapse([2, 2, 2, 2], 2).gained, 8);
  assert.equal(collapse([2, 4, 8, 16], 2).gained, 0, 'no merge, no score');
});

test('other bases keep the same shape', () => {
  assert.deepEqual(collapse([3, 3, 3, null], 3).ops.map(o => o.val), [9, 3]);
  assert.deepEqual(collapse([4, 4, 16, 16], 4).ops.map(o => o.val), [16, 64]);
  assert.deepEqual(collapse([10, 10, null, null], 10).ops.map(o => o.val), [100]);
});

test('movesBoard tells a real move from a no-op', () => {
  assert.equal(movesBoard(collapse([2, 4, 8, 16], 2).ops), false, 'packed line, nothing moves');
  assert.equal(movesBoard(collapse([null, 2, 4, 8], 2).ops), true, 'a gap means it slides');
  assert.equal(movesBoard(collapse([2, 2, 4, 8], 2).ops), true, 'a merge counts');
  assert.equal(movesBoard(collapse([], 2).ops), false, 'empty line');
});

test('isStuck', () => {
  const full = v => [[v, 2, v, 2], [2, v, 2, v], [v, 2, v, 2], [2, v, 2, v]];
  assert.equal(isStuck(full(4)), true, 'full checkerboard with no neighbours equal');
  assert.equal(isStuck([[2, 2, 4, 8], [4, 8, 16, 32], [2, 4, 8, 16], [4, 8, 16, 32]]), false, 'a matching pair remains');
  const withGap = full(4); withGap[0][0] = null;
  assert.equal(isStuck(withGap), false, 'an empty cell is always a move');
});

test('spawnValue: base 90% of the time, base² otherwise', () => {
  assert.equal(spawnValue(3, () => .5), 3);
  assert.equal(spawnValue(3, () => .95), 9);
});
