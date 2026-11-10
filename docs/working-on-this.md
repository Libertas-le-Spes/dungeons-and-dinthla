# Working on this project

This page is for whoever picks the work up on another machine, person or session. It changes as the project does: whoever makes part of it untrue fixes it in the same change.

## Where things are

- **Work to do:** the [board](https://github.com/orgs/Libertas-le-Spes/projects/1), ordered top to bottom. [project-board.md](project-board.md) explains it.
- **Work in flight:** open pull requests. Each one's latest handover comment says what is left, what was decided and what waits on the owner. Read it before touching the branch.

## How the owner wants it built

- **Design before code.** No feature code until the owner has designed it and asked for a build. "Start X" means scaffold only.
- **Note syntax must be typeable.** Every line a player writes is typed by hand on a tablet mid-session: a short marker and a word or two. No block ids, no `[[Note#^id|alias]]`.
- **Safety first.** Rank every security choice by how safe it is, and nothing else. Layer the protections and fail closed. The plugin reads and writes only inside the Campaigns folder, and the bundle holds no network code.
- **Code:** no comments in any file, one class per kind with no switching on kinds, one job per file, and no ternaries or `||`/`??` shortcuts.
- **Tests** check this project's code, not Obsidian's, with made-up names only. Each test's setup is exactly the scenario its name claims. Prove a guard by taking it out once and watching a test fail.
- **No attribution.** Nothing in commits, pull requests or docs credits a tool.

## Before merging

1. Fresh reviewers who know only the pull request go over it, split into security, architecture and readability, and tests and docs. Their findings are checked against the code, then fixed and proven.
2. One more fresh review checks the result. Stop when what is left sits only in code that round changed and every failure ends safe.
3. **The owner says yes.** Nothing merges without it.
4. Merge locally with `git merge --no-ff origin/<branch> -m "Merge pull request #N from Libertas-le-Spes/<branch>"` and push `main`. Delete the local branch once its merge is on `main`.

## Releasing

1. Bump the version in `manifest.json`, `package.json`, `package-lock.json` and `versions.json` in one pull request.
2. After it merges, tag `main` with the bare version (`0.3.0`, no `v`) and push the tag.
3. The Release workflow checks the versions, builds, checks the built `main.js` and `styles.css` for network code (`node scripts/check-no-network.ts main.js styles.css`), runs the tests and attaches `main.js`, `manifest.json` and `styles.css`.

Stay on `0.x` until the plugin has held up in real games. Then go to `1.0.0`.

## Running and checking

- Node must be `^22.18.0 || ^24.0.0 || >=26.0.0`: the build and `scripts/` are TypeScript run by Node's own type stripping.
- Run `npm install`, then `npm run build`. The build also copies the plugin into `demo-vault/`. Open `demo-vault` as a vault in Obsidian; the README has the steps. Its campaign still sits at the vault's top, outside any Campaigns folder, so the plugin shows no campaign there until it is moved into one.
- After a build, `node scripts/check-no-network.ts main.js styles.css` checks the built files for network code, as every pull request and release does. It checks only the files it is given and refuses to run with none.
- `npx vitest run` runs the tests. Tests must not open a real browser.
- When the owner is gaming on the machine, run builds and tests at low priority, one builder at a time:

  ```
  systemd-run --user --scope -p CPUWeight=10 -p IOWeight=10 -p MemoryMax=4G -p MemorySwapMax=0 nice -n 19 <command>
  ```

- **`demo-vault/` may hold the owner's own uncommitted notes.** Never stage, move or commit them without asking.
