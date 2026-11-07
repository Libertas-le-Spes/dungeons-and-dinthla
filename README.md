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

Build it, then copy `manifest.json` and `main.js` into `<vault>/.obsidian/plugins/dungeons-and-dinthla/` and turn it on under Community plugins.

```
npm install
npm run build
```

## Notes

[docs/note-format.md](docs/note-format.md) says how a campaign is kept in plain notes: the folders, sessions, marked lines and character facts the plugin reads and writes.

## Planning

Work is planned as epics, stories and tasks on the [Dungeons & Dinthla Backlog](https://github.com/orgs/Libertas-le-Spes/projects/1) board. [docs/project-board.md](docs/project-board.md) says how the board works and why.
