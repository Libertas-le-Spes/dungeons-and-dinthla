<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="logo/wordmark-dark.svg">
    <img alt="Dungeons & Dinthla" src="logo/wordmark-light.svg" width="420">
  </picture>
</h1>

An Obsidian plugin for tabletop campaign notes. You write what happens at the table in short lines, and the plugin keeps track of the open questions, quests, money and items, and fills in a sheet for each character. It is made for players first, and works the same on a phone or tablet.

## Install

Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/releases/latest).

- **Computer:** in Obsidian, open **Settings → Community plugins** and click the folder icon next to *Installed plugins*. Make a folder named `dungeons-and-dinthla` there, put the three files in it, and turn the plugin on.
- **Phone or tablet, with a synced vault:** install it on a computer and let the vault sync, then turn the plugin on under **Settings → Community plugins**.
- **Phone or tablet, without sync:** use a file manager to put the three files in `.obsidian/plugins/dungeons-and-dinthla` inside the vault, then turn the plugin on.

To try it first, download the starter vault zip from the same release, unzip it and open the folder as a vault.

The [install guide](docs/install.md) has the steps in full, with updating, removing and what to do when something does not work.

## Writing sessions

A session is an ordinary note. The first character of a line says what it is:

```markdown
Tracks lead to the [[Old Mill]].
? Why does the mill wheel turn at night
! Find the missing caravan, from: [[Lady Vess]], reward: 200 gp
$ 35 gp from the bandits at the ford
$ [[Mira]] Silvered lantern
[[Mira]] AC: 15, class: rogue
```

`?` is a question, `!` is a quest and `$` is coin or an item. A link followed by values fills in that character's sheet. Every other line is a plain note.

Coin goes out only when the amount has a minus sign or a dash before it, such as `-5 gp ferry`. Every other amount is money in.

To answer a question or move a quest on, start a line in the session box with `??`, `!!` or `$$` and pick the earlier line. The welcome page shows the rest when you first open the plugin.

A character from an earlier campaign can keep their values in a new one. On their note in the new campaign, add `carried from` with a link to their old note, and `carried` with `abilities`, `values` or both. The plugin explains this once, when you make your second campaign.

## Working on this project

Building, testing and releasing are in [working on this project](docs/working-on-this.md). The work still to do is in the open issues.

## Privacy

The plugin reads and writes only inside the one folder you choose for your campaigns. It sends nothing anywhere, unless you press the button that brings a character in from D&D Beyond, and it asks before the first time. Your campaign stays plain Markdown and reads fine with the plugin turned off. [Privacy](docs/privacy.md) says exactly what is sent and what is kept.
