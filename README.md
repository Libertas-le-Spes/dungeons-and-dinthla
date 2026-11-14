<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="logo/wordmark-dark.svg">
    <img alt="Dungeons & Dinthla" src="logo/wordmark-light.svg" width="420">
  </picture>
</h1>

An Obsidian plugin for tabletop campaign notes. You write what happens at the table, and the plugin keeps track of the open questions, quests and money, and fills in sheets for the people, places, factions and items you meet.

Each session's `?`, `!` and `$` lines also show in notes of their own, `Questions/Session 2.md`, `Quests/Session 2.md` and `Funds/Session 2.md`, linked back to the session, and an item named on three lines gets `Items/<item>.md`. The session lines stay the record, and the words you write below a note's properties are never touched (see [Kind notes](docs/note-format.md#kind-notes)).

It is built for players first, and for DMs and researchers on the same footing. It works on Obsidian mobile, since most notes are taken on a tablet at the table.

This README describes a project that grows in small steps: parts of it may still be planned, and whoever's change makes any of it untrue updates it in the same change.

## Install

The plugin isn't in Obsidian's list of community plugins yet, and this repository is private, so it is installed by hand, by someone with read access to it. Each tagged version is published as a [release](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/releases) with three files: `main.js`, `manifest.json` and `styles.css`.

1. Download the three files from the latest release, with `gh release download <version> --repo Libertas-le-Spes/dungeons-and-dinthla` or from the release's page, or build them yourself (below).
2. If you downloaded them, check them against the release. With the [GitHub CLI](https://cli.github.com) logged in, `gh release view <version> --repo Libertas-le-Spes/dungeons-and-dinthla --json assets --jq '.assets[] | .digest + "  " + .name'` prints each file's digest, where `<version>` is the bare tag, such as `0.3.0`. In the download folder, `sha256sum main.js manifest.json styles.css` (on macOS `shasum -a 256`, on Windows `Get-FileHash`) must print the same hashes as the part after `sha256:`, ignoring upper and lower case.
3. Put them in `<vault>/.obsidian/plugins/dungeons-and-dinthla/`. `.obsidian` is the vault's settings folder, hidden on most systems.
4. In Obsidian, open Settings → Community plugins. If Obsidian is in Restricted mode, press *Exit Restricted mode* (*Turn on community plugins* in older versions). Then restart Obsidian, or press *Reload plugins* (the circular arrows beside *Installed plugins*), so it finds the new plugin.
5. Turn on **Dungeons & Dinthla** there.

**On a phone or tablet** whose vault is kept in a Git repository (with the Obsidian Git plugin, say): do steps 1 to 3 in a copy of that repository on a computer, commit only the plugin's folder and push, then pull on the phone or tablet and do steps 4 and 5 there. If the repository also holds `.obsidian/community-plugins.json`, that choice syncs too: other devices that pull it have the plugin turned on after Obsidian restarts.

**To update,** replace the three files with the new release's, the same way. Obsidian loads the new version when it starts again, or after *Reload plugins* when the plugin is turned off and on.

**To build it yourself,** check out the release's tag (`git checkout 0.3.0`) and, with Node `^22.18.0 || ^24.0.0 || >=26.0.0`, run the following. It leaves the three files in the repository's root, byte for byte the same as the release's.

```
npm ci
npm run build
```

Once the plugin is on, choose the **Campaigns folder**, on the welcome page or in the plugin's settings: the one folder of the vault where your campaigns live, such as `D&D`. The plugin reads and writes only inside it and does nothing until it is chosen, so the rest of your vault stays out of its reach. Every pull request and release scans the plugin's source for code that could go round that fence, working from allow-lists of what the plugin uses today and known patterns, and checks its released `main.js` and `styles.css` for known kinds of network code. Neither is a proof: they catch what they know to look for. [docs/note-format.md](docs/note-format.md#the-campaigns-folder) says what they check.

The plugin checks paths, so it can't see where a folder really is: a symbolic link (or, on Windows, a junction) inside the Campaigns folder that points elsewhere on your disk lets the plugin read and write there too. Keep such links out of the Campaigns folder.

## Demo vault

`demo-vault/` is a small Obsidian vault with one made-up campaign, *Curse of the Pale Moon*, kept in the note format below. It shows what `main` can do after each merge, without touching your own vault.

1. Run `npm run build`. It builds `main.js` and `styles.css`, then copies them and `manifest.json` into the demo vault's plugin folder.
2. In Obsidian, choose **Open folder as vault** and pick `demo-vault`.
3. When Obsidian asks whether you trust the vault's author, choose **Trust author and enable plugins**. Dungeons & Dinthla is then turned on under Community plugins.
4. The demo campaign sits in `D&D/Curse of the Pale Moon/`. If the campaign tab asks for the Campaigns folder, choose `D&D`.

After the next build, reload the vault (**Reload app without saving** in the command palette, or Ctrl+R on desktop) to see the newest version. When the note format changes, the demo notes change in the same pull request, and each pull request says what to look for in the demo vault.

## Look

The plugin follows the [Dungeons & Dinthla design system](https://claude.ai/artifact/TPqcxoS9uio8boYoScD8Uk). With Obsidian's default theme its pages use the Dinthla colours, light or dark. With any other theme, such as an Omarchy theme, they take that theme's colours instead, lightened or darkened where needed so text stays readable. Headings use Alegreya and Alegreya SC, which are built into `styles.css`. Everything else uses Obsidian's own fonts.

`styles.css` is built from `styles/` by `npm run build`. `tests/styles/contrast.test.ts` checks the prototype's contrast pairs in both Dinthla themes, Tokyo Night and Catppuccin Latte.

## Notes

[docs/note-format.md](docs/note-format.md) says how a campaign is kept in plain notes: the folders, sessions, marked lines and character facts the plugin reads and writes.

## Importing a character from D&D Beyond

In the plugin, press *Import from D&D Beyond* on the Characters page, paste your character's link or number and press *Bring in from D&D Beyond*. The plugin asks once, on each device, before it sends anything (see *Network use* below). Or bring your character in from its PDF: on D&D Beyond, open your character, choose *Manage* next to the name, then *Export to PDF* at the bottom of the menu, and choose that file in the same dialog. A PDF is read on your device and sends nothing anywhere. Either way the plugin shows what will be written before it writes. [docs/note-format.md](docs/note-format.md#importing-online) has the details.

A short walkthrough:

1. On the Characters page, press *Import from D&D Beyond*, type your character's link and press *Bring in from D&D Beyond* (or export a PDF on D&D Beyond and choose that file instead); check what comes in and press *Import*.
2. Your character's sheet opens, and the plugin offers to make them your character in this campaign. Under the values you'll find your inventory, purse, spells and features, as D&D Beyond has them.
3. Press *Track on the funds page* beside an item to give it to your character on the Party funds page, where the party can see it.
4. Your own purse shows on the Party funds page beside the party's once the campaign note names your character, and is never added to it.
5. After a level-up, press *Update from D&D Beyond* on your sheet and bring your character in again, online or by a new PDF. Anything you hold on the funds page that the new sheet doesn't list is marked; pick *Used up*, *Sold*, *Lost* or *Changed* to settle it.

When a character leaves play:

1. Import your next character. The plugin asks what happened to the one you played: *Died*, *Retired* or *Backup*.
2. For *Died* or *Retired*, you can say what they were last doing. Their note moves to the campaign's `Fallen` folder with a dated snapshot added at the bottom, and the new character becomes yours.
3. A *Backup* stays in `Characters`. You'll find your backups at the bottom of the Characters page, each with *Make main* for when you want to play them, and the *Fallen* list sits below them.
4. Fallen characters are listed on the Characters page under *Fallen*, each with *Make main*. Their note moves back to `Characters` and keeps its snapshots; if they leave play again, another dated snapshot is added.
5. If a switch stops part way, the message says what was written. Press *Make main* again to finish it.

### Agreeing to the online import

The plugin can fetch your character from D&D Beyond with one button, and it asks first, once on each device:

1. After you make a campaign on the welcome page, you'll see *Bringing your character in*. Read what the online import would send.
2. Press *Agree* if that's fine with you, or *Not yet* to decide later. Either way, the page moves on.
3. Your answer stays on this device only, never in your vault, so another device you sync to doesn't know it. The welcome page shows by itself once per vault, so a second device never shows this step; it will ask at the first press of the online button. If you pressed *Not yet*, the step comes back only when you open the welcome page again with *Show this again* in the plugin's settings, and the online button will ask at its first press.

[docs/note-format.md](docs/note-format.md#the-dd-beyond-agreement) has the words and where the answer is kept.

## Network use

The plugin sends nothing anywhere, with one exception: bringing your character in from D&D Beyond online.

- **What is sent.** One GET to `https://character-service.dndbeyond.com/character/v5/character/` followed by your character's number, and nothing else: no login, no cookies, no other header, no body. Nothing from the rest of a link you paste reaches the address.
- **When.** Only when you press *Bring in from D&D Beyond*, after you have agreed once on this device. Never in the background, never on a timer, never again by itself, with no retries and nothing cached. One call at a time, ten seconds apart at least, and the plugin stops waiting after fifteen seconds.
- **What comes back and what is kept.** The character's data. The plugin checks it (status 200, JSON, at most 5 MB, the number you asked for), reads from it only what the import shows, and throws the rest away, including your character's backstory and notes. Nothing is written to your vault until you press *Import* or *Update* on the review.
- **Public characters only.** The character must be set to Public on D&D Beyond, which makes its data, notes and backstory included, readable by anyone with the link.
- **D&D Beyond's terms don't authorise this.** There is no official way to read a character's data. The address is the one D&D Beyond's own pages use, it is undocumented, and it can change or close without notice; the PDF route still works then.
- **What the plugin cannot rule out.** Obsidian's request follows redirects and can't be told not to, so the checks are on whatever finally answers. On the desktop app Obsidian's own request may carry any cookie Obsidian itself holds for that site, normally none, since nobody signs in to D&D Beyond inside Obsidian. D&D Beyond sees your device's address and your character's number.
- **How it is kept to that.** The built `main.js` holds exactly this one call and this one address, and every pull request and release fails if it holds anything more; `styles.css` may hold no address at all. [docs/note-format.md](docs/note-format.md#the-campaigns-folder) lists what is checked.

## Planning

Work is planned as epics, stories and tasks on the [Dungeons & Dinthla Backlog](https://github.com/orgs/Libertas-le-Spes/projects/1) board. [docs/project-board.md](docs/project-board.md) says how the board works and why.
