# Working on this project

This page is for whoever picks up the work. The project grows in small steps, so parts of this may change. Whoever makes part of it untrue fixes it in the same change.

Work to do is in the open issues. Work in flight is in the open pull requests.

## How it is built

- **Design before code.** A feature is built only after the owner has designed it and asked for it.
- **Lines must be typeable.** A player types every line by hand on a tablet mid-session: a short marker and a few words. No block ids, no `[[Note#^id|alias]]`.
- **Safety first.** Pick the safest option every time, layer protections, and fail closed. The plugin stays inside the Campaigns folder, and its only network use is the one D&D Beyond request in `src/obsidian/online/obsidian-beyond-call.ts`. [Privacy](privacy.md) describes both from the user's side.
- **Code:** no comments, one class per kind with no switching on kinds, one job per file, and no ternaries or `||`/`??` shortcuts.
- **Tests** check this project's code, not Obsidian's, with made-up names. The tests are the detailed specification: when behaviour changes, a test changes with it.
- **No attribution.** Nothing in commits, pull requests or docs credits a tool.

## Obsidian kept apart

The plugin's own code is meant to work with any notes program, with Obsidian as one adapter:

- `src/host/` holds what the plugin needs from a notes program, as interfaces.
- `src/obsidian/` holds the Obsidian side. `src/fence/gate/` is the gatekeeper over Obsidian's vault, and `src/main.ts` only starts it.
- Everything else is the plugin's own and may not load `obsidian` or `@codemirror/*`. `tests/build/obsidian-side.test.ts` and `tests/fence/scan/code-rules/host-neutral-rules.ts` enforce this.

Styles follow the same split. `styles/plugin/` uses only the plugin's own `--dd-` variables, and `styles/obsidian/theme.css` maps them to Obsidian's theme. No stylesheet or source file may write a literal colour, and `tests/styles/contrast.test.ts` checks contrast in light and dark themes.

## Building and testing

You need Node `^22.18.0 || ^24.0.0 || >=26.0.0`.

```
npm install
npm run build
npm test
```

- `npm run build` writes `main.js` and `styles.css` and copies the plugin into `demo-vault/`. Open `demo-vault` as a vault in Obsidian to try `main`, with `D&D` as the Campaigns folder. When the note format changes, the demo notes change in the same pull request.
- `npm test` runs inside a 3 GB memory box when the machine can make one. Arguments after `npm test --` go to vitest. Tests must never open a real browser.
- `node scripts/check-no-network.ts main.js styles.css` checks the built files for network code, as CI does. It flags every `.write(` and `submit` beyond the known ones in `scripts/network-code.ts`, so don't name a method `write` or `submit`. Rename the method; never loosen the check.
- `demo-vault/` may hold the owner's own uncommitted notes. Never stage, move or commit them without asking.

To keep the machine responsive, run heavy work at low priority:

```
systemd-run --user --scope -p CPUWeight=10 -p IOWeight=10 -p MemoryMax=4G -p MemorySwapMax=0 nice -n 19 <command>
```

## Merging

Fresh reviewers who know only the pull request go over it once. Their findings are checked against the code, fixed and proven. Then merge locally with `git merge --no-ff`, push `main`, and delete the branch.

## Releasing

1. Bump the version in `manifest.json`, `package.json`, `package-lock.json` and `versions.json` in one pull request.
2. After it merges, tag `main` with the bare version (`0.4.1`, no `v`) and push the tag.
3. The Release workflow checks the versions, builds, runs the network check and the tests, and attaches `main.js`, `manifest.json` and `styles.css`.
4. `node scripts/starter-vault.ts <release folder> <zip>` builds the starter vault from the committed `demo-vault/` and the release's files. Attach it on the owner's yes.

Anyone can rebuild a release: check out its tag and run `npm ci` and `npm run build`. The three files come out byte for byte the same as the release's.

Stay on `0.x` until the plugin has held up in real games.
