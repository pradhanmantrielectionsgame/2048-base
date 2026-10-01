/**
 * Writes icons/icon-192.png and icon-512.png: a 2x2 tile grid, last tile in the given colour.
 *   node scripts/make-icons.mjs [#rrggbb]
 *
 * ponytail: hand-rasterised, no image dependency; swap in real artwork any time.
 */
import {deflateSync} from 'node:zlib';
import {writeFileSync, mkdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const hex = process.argv[2]
  || JSON.parse(readFileSync(join(ROOT, 'manifest.webmanifest'), 'utf8')).theme_color
  || '#007aff';
const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));

const crcTable = Array.from({length: 256}, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = buf => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

// Four rounded tiles on a board, inside the maskable safe zone (inner 80%).
const TILES = [[0xee, 0xe4, 0xda], [0xf2, 0xb1, 0x79], [0xf6, 0x5e, 0x3b], rgb];
const BOARD = [0xbb, 0xad, 0xa0];

/** Coverage 0..1 of pixel (x, y) by a rounded rect, 1px anti-aliased edge. */
const cover = (x, y, x0, y0, w, h, rad) => {
  const dx = Math.abs(x - (x0 + w / 2)) - (w / 2 - rad);
  const dy = Math.abs(y - (y0 + h / 2)) - (h / 2 - rad);
  const d = Math.hypot(Math.max(dx, 0), Math.max(dy, 0)) + Math.min(Math.max(dx, dy), 0) - rad;
  return Math.min(1, Math.max(0, 0.5 - d));
};

function png(size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;                      // 8-bit, truecolour RGB
  const m = size * 0.1, bw = size * 0.8, gap = bw * 0.06, tw = (bw - 3 * gap) / 2;
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let px = BOARD;                              // full-bleed so maskable crops stay solid
    TILES.forEach((c, i) => {
      const x0 = m + gap + (i % 2) * (tw + gap), y0 = m + gap + (i >> 1) * (tw + gap);
      const a = cover(x + .5, y + .5, x0, y0, tw, tw, tw * 0.14);
      if (a) px = px.map((v, k) => v + (c[k] - v) * a);
    });
    const o = y * (size * 3 + 1);
    raw[o + 1 + x * 3] = px[0]; raw[o + 2 + x * 3] = px[1]; raw[o + 3 + x * 3] = px[2];
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(join(ROOT, 'icons'), {recursive: true});
for (const size of [192, 512]) {
  writeFileSync(join(ROOT, 'icons', `icon-${size}.png`), png(size));
}
console.log(`icons written in ${hex}`);
