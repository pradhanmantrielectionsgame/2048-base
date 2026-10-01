## 2026-10-01 — First release needs the remote and upstream set by hand
**Finding:** The game had never been pushed: `origin` pointed at a GitHub repo that did not exist (`Repository not found`), and `npm run release ... --push` failed after tagging with "The current branch main has no upstream branch".
**Context:** Found while fixing the lost-progress bug; the live copy people had been playing was a dead Cloudflare cache, not GitHub Pages.
**Implication:** For a new game, run `gh repo create <account>/<id> --public --source .`, enable Pages with `gh api -X POST repos/<account>/<id>/pages -f build_type=workflow`, then `git push -u origin main --follow-tags` once. After that `npm run release` works normally. `new-game.mjs` does not do any of this.

## 2026-10-01 — Saved game was one slot shared by all bases
**Finding:** Progress was saved under a single `state` key, so picking another base called `reset()` and wiped the game in progress.
**Context:** User played base 2, switched to base 4, and lost the base-2 board.
**Implication:** Saves are now per base (`state:<base>`); old `state` is migrated on load. Any new per-game setting should say whether it is per base or global.
