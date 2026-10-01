/** DOM glue for N048. Rules live in logic.mjs. */
import {onInput, haptic, storage, audio, share, onPause, registerSW} from './kit.mjs';
import {SIZE, WIN_EXP, cellsOf, collapse, movesBoard, isStuck, spawnValue} from './logic.mjs';

const $ = s => document.querySelector(s);
const board = $('#board');
const store = storage('n048');
const sfx = audio(store);

let base = store.get('base', 2), frac = store.get('frac', false);
let tiles = [], score = 0, uid = 0, won = false, over = false, busy = false;

const fmt = n => n < 100000 ? String(n)
  : n.toLocaleString('en-US', {notation: 'compact', maximumFractionDigits: 1});

/** Tile/goal label: 8 or, in fraction mode, 1/8. */
const label = v => frac ? `1/${fmt(v)}` : fmt(v);

const at = (r, c) => tiles.find(t => t.r === r && t.c === c && !t.dead);
const grid = () => Array.from({length: SIZE}, (_, r) =>
  Array.from({length: SIZE}, (_, c) => at(r, c)?.val ?? null));

function move(dir) {
  if (over || busy || !cellsOf[dir]) return;
  let moved = false, gained = 0, merges = 0;

  for (let k = 0; k < SIZE; k++) {
    const cells = Array.from({length: SIZE}, (_, i) => cellsOf[dir](k, i));
    const line = cells.map(([r, c]) => at(r, c));
    const {ops, gained: g} = collapse(line.map(t => t?.val ?? null), base);
    gained += g;
    if (movesBoard(ops)) moved = true;
    for (const op of ops) {
      const [r, c] = cells[op.to];
      const keep = line[op.from[0]];
      keep.r = r; keep.c = c;
      if (op.from.length > 1) {
        const eaten = line[op.from[1]];
        eaten.r = r; eaten.c = c; eaten.dead = true;
        keep.val = op.val; keep.pop = true;
        merges++;
      }
    }
  }
  if (!moved) return;

  score += gained;
  if (merges) { sfx.beep(220 + 60 * merges); haptic(); } else { sfx.beep(160, .04, 'sine', .02); }
  busy = true;
  render();

  setTimeout(() => {
    tiles = tiles.filter(t => !t.dead);
    spawn();
    render();
    save();
    busy = false;
    if (!won && tiles.some(t => t.val >= base ** WIN_EXP)) { won = true; sfx.beep(880, .3, 'triangle'); end('You win!'); }
    else if (isStuck(grid())) { over = true; sfx.beep(110, .4, 'sawtooth'); end('Game over'); }
  }, 110);
}

function spawn() {
  const free = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!at(r, c)) free.push([r, c]);
  if (!free.length) return;
  const [r, c] = free[Math.random() * free.length | 0];
  tiles.push({id: ++uid, r, c, val: spawnValue(base), fresh: true});
}

function render() {
  for (const t of tiles) {
    if (!t.el) {
      t.el = document.createElement('div');
      t.el.className = 'tile';
      board.appendChild(t.el);
    }
    const exp = Math.round(Math.log(t.val) / Math.log(base));
    const txt = label(t.val);
    t.el.textContent = txt;
    // ponytail: hue from the exponent instead of a hand-tuned palette — one line, works at every base
    t.el.style.background = exp <= 2 ? `hsl(${40 - exp * 6} 45% ${90 - exp * 6}%)` : `hsl(${(exp * 36) % 360} 65% 52%)`;
    t.el.style.color = exp <= 2 ? '#776e65' : '#fff';
    t.el.style.fontSize = `calc(var(--cs) * ${txt.length <= 2 ? .42 : txt.length <= 4 ? .32 : txt.length <= 6 ? .24 : .17})`;
    t.el.style.zIndex = t.dead ? 1 : 2;
    const tr = `translate(calc((var(--cs) + var(--g)) * ${t.c}), calc((var(--cs) + var(--g)) * ${t.r}))`;
    t.el.style.setProperty('--t', tr);
    t.el.style.transform = tr;
    if (t.fresh) { t.fresh = false; t.el.classList.add('new'); }
    if (t.pop) { t.pop = false; t.el.classList.remove('pop'); void t.el.offsetWidth; t.el.classList.add('pop'); }
    if (t.dead) setTimeout(() => t.el.remove(), 110);
  }
  const best = Math.max(score, store.get(`best:${base}`, 0));
  store.set(`best:${base}`, best);
  $('#score').textContent = fmt(score);
  $('#best').textContent = fmt(best);
}

function end(text) {
  $('#msgtext').textContent = text;
  $('#again').textContent = over ? 'Try again' : 'Keep going';
  $('#msg').classList.add('show');
}

function save() {
  store.set(`state:${base}`, {base, score, won, over, tiles: tiles.map(({r, c, val}) => ({r, c, val}))});
}

function setGoal() {                                 // full digits, never abbreviated
  const n = (base ** WIN_EXP).toLocaleString('en-US'), goal = frac ? `1/${n}` : n;
  $('#goal').textContent = goal;
  $('#goal').style.fontSize = goal.length > 12 ? '17px' : goal.length > 8 ? '21px' : '26px';
}

function reset() {
  tiles.forEach(t => t.el?.remove());
  tiles = []; score = 0; won = false; over = false; busy = false;
  $('#msg').classList.remove('show');
  store.set('base', base);
  store.del(`state:${base}`);
  setGoal();
  $('#hintbase').textContent = base;
  document.querySelectorAll('#bases button').forEach(b => b.setAttribute('aria-pressed', +b.dataset.b === base));
  spawn(); spawn(); render();
}

/** Restore an interrupted game, or start a new one. */
function restore() {
  const old = store.get('state');                    // pre-0.1.1 single save slot
  if (old) { store.set(`state:${old.base}`, old); store.del('state'); }
  const s = store.get(`state:${base}`);
  if (!s || !s.tiles?.length) return reset();
  reset();
  tiles.forEach(t => t.el?.remove());
  tiles = s.tiles.map(t => ({...t, id: ++uid, fresh: true}));
  score = s.score; won = s.won; over = s.over;
  render();
  if (over) end('Game over');
}

function layout() {
  const cs = (board.clientWidth - 2 * 8 - 3 * 8) / SIZE;   // --p both sides + 3 gaps of --g
  document.documentElement.style.setProperty('--cs', cs + 'px');
}
new ResizeObserver(layout).observe(board);                 // covers rotation + address-bar resize

for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  cell.style.transform = `translate(calc((var(--cs) + var(--g)) * ${c}), calc((var(--cs) + var(--g)) * ${r}))`;
  board.appendChild(cell);
}

for (let b = 2; b <= 10; b++) {
  const btn = document.createElement('button');
  btn.textContent = b;
  btn.dataset.b = b;
  btn.onclick = () => { save(); base = b; restore(); };   // each base keeps its own game
  $('#bases').appendChild(btn);
}

onInput(board, dir => { if (dir !== 'tap') move(dir); });
$('#new').onclick = () => { reset(); save(); };
$('#again').onclick = () => { if (over) { reset(); save(); } else $('#msg').classList.remove('show'); };
$('#frac').onclick = () => {                          // relabel only; tile values and rules are untouched
  frac = !frac; store.set('frac', frac);
  $('#frac').setAttribute('aria-pressed', frac);
  setGoal();
  render();
};
$('#frac').setAttribute('aria-pressed', frac);
$('#sound').onclick = e => { e.target.textContent = sfx.toggle() ? '🔇' : '🔊'; };
$('#sound').textContent = sfx.muted ? '🔇' : '🔊';
$('#share').onclick = async () => {
  const top = Math.max(...tiles.map(t => t.val), 0);
  const res = await share({text: `N048 base ${base} — ${fmt(score)} points, best tile ${fmt(top)}.`});
  if (res === 'copied') $('#share').textContent = 'Copied!';
  setTimeout(() => { $('#share').textContent = 'Share'; }, 1500);
};

onPause(save);
registerSW();
layout();
restore();
