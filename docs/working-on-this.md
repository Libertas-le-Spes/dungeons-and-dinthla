# Working on this project

This page is for whoever picks the work up on another machine, person or session. It changes as the project does: whoever makes part of it untrue fixes it in the same change.

## Where things are

- **Plan and designs:** the plan doc, https://claude.ai/artifact/4fxu6ozZmBYddhUxue4v8t. The *One interface* tab holds the interface design and the help design.
- **Work to do:** the [board](https://github.com/orgs/Libertas-le-Spes/projects/1), ordered top to bottom. [project-board.md](project-board.md) explains it.
- **Work in flight:** open pull requests. Each one's latest handover comment says what is left, what was decided and what waits on the owner. Read it before touching the branch.

## How the owner wants it built

- **Design before code.** No feature code until the owner has designed it and asked for a build. "Start X" means scaffold only.
- **Note syntax must be typeable.** Every line a player writes is typed by hand on a tablet mid-session: a short marker and a word or two. No block ids, no `[[Note#^id|alias]]`.
- **Safety first.** Rank every security choice by how safe it is, and nothing else. Layer the protections and fail closed. The plugin reads and writes only inside the Campaigns folder. Its only network use is one GET to `character-service.dndbeyond.com` for a public D&D Beyond character, made only when the user presses the online import or update button after agreeing on that device. Nothing runs in the background, and the plugin adds no login or cookies. The bundle holds only that one call, in `src/online/beyond-call.ts`, and nothing else that could go online.
- **Code:** no comments in any file, one class per kind with no switching on kinds, one job per file, and no ternaries or `||`/`??` shortcuts.
- **Tests** check this project's code, not Obsidian's, with made-up names only. Each test's setup is exactly the scenario its name claims. Prove a guard by taking it out once and watching a test fail.
- **No attribution.** Nothing in commits, pull requests or docs credits a tool.

## Numbers in a pull request

Every count a pull request states comes from a command, not from counting by hand, and **the command has to count the thing being claimed**:

- Files moved: `git diff -M --name-status origin/main...HEAD | grep -cE '^[RA]'`. Counting only `^R` misses a short file whose imports are most of its lines, which git records as a delete and an add rather than a rename.
- Allowance paths: `grep -o '"<area>/[^"]*"' <each allow-list file> | wc -l`, per file. The lists holding them are the `const NAME = [` lines above each hit, and there are usually more lists than there are files.
- Which list a path sits in: `grep -n '<the file name>' tests/fence/...`, before naming that list in a proof table. A table naming the wrong list makes the proof unreproducible.
- Tests: the runner's own total.

Four pull requests in the folder-move series stated a count that was short or a list that was wrong, and a reviewer had to put each right; a wrong number reads as a proof that wasn't run.

## Moving files

A type check (`tsc --noEmit`) proves the imports and nothing else. After a move, look for what it cannot see:

- **String paths.** A path inside a string is only text to it: the strings in allow-lists and in scanner samples, `vi.mock("…")`, and the folders named in docs.
- **Anything computed from `import.meta.url` or a count of folders up.** `new URL("../..", import.meta.url)` is a different folder one level deeper, and nothing fails to compile.
- **A rule that reads a folder flat.** A check that lists a folder's entries and reads each as a file sees nothing, or fails, once the files sit in subfolders.

A script that moves files and rewrites their imports (a mover) also rewrites anything that looks like `from "./x"` inside **string fixtures**, such as a planted project held as a string in a test. When proving a move changed only paths, compare with only the real imports and the `vi.mock(…)` and `import(…)` calls set aside. Do not blank every relative-path string literal first: that hides this mistake. Then run the whole suite, since the tests are what find the rest, and take out one allow-list entry or guard path once to watch a test fail, since a path that went stale makes a guard stop guarding without a word.

## Before merging

1. Fresh reviewers who know only the pull request go over it, split into security, architecture and readability, and tests and docs. Their findings are checked against the code, then fixed and proven.
2. One more fresh review checks the result. Stop when what is left sits only in code that round changed and every failure ends safe.
3. **The owner says yes.** Nothing merges without it.
4. Merge locally with `git merge --no-ff origin/<branch> -m "Merge pull request #N from Libertas-le-Spes/<branch>"` and push `main`. The repo's hooks set commit times to midday.

## Deleting branches

A branch is deleted, locally and on origin, as soon as it is merged or becomes useless. First check that every commit on it is contained in `main`, or in the branch that took its work over: `git branch --contains <last commit>` and `git log main..<branch>` (which must list nothing) show it. Then `git branch -d <branch>` and `git push origin --delete <branch>`. A branch whose commits aren't contained anywhere is never deleted without the owner's yes.

## Releasing

1. Bump the version in `manifest.json`, `package.json`, `package-lock.json` and `versions.json` in one pull request.
2. After it merges, tag `main` with the bare version (`0.3.0`, no `v`) and push the tag.
3. The Release workflow checks the versions, builds, checks the built `main.js` and `styles.css` for network code beyond the one D&D Beyond call (`node scripts/check-no-network.ts main.js styles.css`), runs the tests and attaches `main.js`, `manifest.json` and `styles.css`.

Stay on `0.x` until the plugin has held up in real games. Then go to `1.0.0`.

## Running and checking

- Node must be `^22.18.0 || ^24.0.0 || >=26.0.0`: the build and `scripts/` are TypeScript run by Node's own type stripping.
- Run `npm install`, then `npm run build`. The build also copies the plugin into `demo-vault/`. Open `demo-vault` as a vault in Obsidian; the README has the steps. Its campaign sits in `D&D/Curse of the Pale Moon/`, with `D&D` as the Campaigns folder. Keep the demo vault up to date: when the note format or the folder rules change, the demo notes change in the same pull request.
- After a build, `node scripts/check-no-network.ts main.js styles.css` checks the built files for network code, as every pull request and release does. It lets through exactly one call and one address, the D&D Beyond call, and fails on anything more. It checks only the files it is given and refuses to run with none. It flags every `.write(` call and every `submit`, except the known ones at their exact counts in `scripts/network-code.ts`, so don't name a method `write` or `submit`. Rename the method; never loosen the check.
- `npm test` runs the tests inside a 3 GB memory box with no swap (`systemd-run --user --scope`) when this machine can make one, and otherwise with one worker; arguments after `npm test --` go to vitest. A plain `npx vitest run` uses at most two workers (`MOST_TEST_WORKERS` in `tests/setup/memory-limits.ts`); add `--maxWorkers=1` to keep its memory lower still. Tests must not open a real browser.
- To keep the machine responsive for other work, run builds and tests at low priority, one builder at a time:

  ```
  systemd-run --user --scope -p CPUWeight=10 -p IOWeight=10 -p MemoryMax=4G -p MemorySwapMax=0 nice -n 19 <command>
  ```

- **`demo-vault/` may hold the owner's own uncommitted notes.** Never stage, move or commit them without asking.
