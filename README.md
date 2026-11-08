<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="logo/wordmark-dark.svg">
    <img alt="Dungeons & Dinthla" src="logo/wordmark-light.svg" width="420">
  </picture>
</h1>

An Obsidian plugin for tabletop campaign notes. You write what happens at the table, and the plugin keeps track of the open questions, quests and money, and fills in sheets for the people, places, factions and items you meet.

It is built for players first, and for DMs and researchers on the same footing. It works on Obsidian mobile, since most notes are taken on a tablet at the table.

This README describes a project that grows in small steps: parts of it may still be planned, and whoever's change makes any of it untrue updates it in the same change.

## Install

Each tagged version is published as a [release](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/releases) with `main.js`, `manifest.json` and `styles.css`.

On a tablet, install it with the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin by adding `Libertas-le-Spes/dungeons-and-dinthla`. While the repository is private, BRAT needs a fine-grained GitHub personal access token that can read this repository's contents: create one on GitHub and add it in BRAT's settings first.

On a computer, you can instead download the three files from a release into `<vault>/.obsidian/plugins/dungeons-and-dinthla/`. Either way, turn it on under Community plugins.

Or build it yourself, then copy `manifest.json`, `main.js` and `styles.css` into `<vault>/.obsidian/plugins/dungeons-and-dinthla/` and turn it on under Community plugins.

```
npm install
npm run build
```

## Demo vault

`demo-vault/` is a small Obsidian vault with one made-up campaign, *Curse of the Pale Moon*, kept in the note format below. It shows what `main` can do after each merge, without touching your own vault.

1. Run `npm run build`. It builds `main.js` and `styles.css`, then copies them and `manifest.json` into the demo vault's plugin folder.
2. In Obsidian, choose **Open folder as vault** and pick `demo-vault`.
3. When Obsidian asks whether you trust the vault's author, choose **Trust author and enable plugins**. Dungeons & Dinthla is then turned on under Community plugins.

After the next build, reload the vault (**Reload app without saving** in the command palette, or Ctrl+R on desktop) to see the newest version. When the note format changes, the demo notes change in the same pull request, and each pull request says what to look for in the demo vault.

## Look

The plugin follows the [Dungeons & Dinthla design system](https://claude.ai/artifact/TPqcxoS9uio8boYoScD8Uk). With Obsidian's default theme its panels use the Dinthla colours, light or dark. With any other theme, such as an Omarchy theme, they take that theme's colours instead, lightened or darkened where needed so text stays readable. Headings use Alegreya and Alegreya SC, which are built into `styles.css`. Everything else uses Obsidian's own fonts.

`styles.css` is built from `styles/` by `npm run build`. `tests/styles/contrast.test.ts` checks the prototype's contrast pairs in both Dinthla themes, Tokyo Night and Catppuccin Latte.

## Notes

[docs/note-format.md](docs/note-format.md) says how a campaign is kept in plain notes: the folders, sessions, marked lines and character facts the plugin reads and writes.

## Planning

Work is planned as epics, stories and tasks on the [Dungeons & Dinthla Backlog](https://github.com/orgs/Libertas-le-Spes/projects/1) board. [docs/project-board.md](docs/project-board.md) says how the board works and why.
