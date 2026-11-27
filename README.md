<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="logo/wordmark-dark.svg">
    <img alt="Dungeons & Dinthla" src="logo/wordmark-light.svg" width="420">
  </picture>
</h1>

An Obsidian plugin for tabletop campaign notes. You write what happens at the table in short lines. The plugin keeps track of the open questions, quests, money and items, and fills in a sheet for each character.

It is made for players first, and works the same on a phone or tablet.

## What you write

```markdown
Tracks lead to the [[Old Mill]].
? Why does the mill wheel turn at night
! Find the missing caravan, from: [[Lady Vess]], reward: 200 gp
$ 35 gp from the bandits at the ford
$ [[Mira]] Silvered lantern
```

A line starting with `?` is a question, `!` is a quest, and `$` is coin or an item. Every other line is an ordinary note.

## Install

1. Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/releases/latest).
2. Put them in a folder named `dungeons-and-dinthla` inside your vault's `.obsidian/plugins` folder.
3. In Obsidian, turn on **Dungeons & Dinthla** under **Settings → Community plugins**.

To try it without touching your own notes, download the starter vault zip from the same release and open it as a vault.

The [install guide](docs/install.md) covers phones and tablets, updating and removing it, and checking the files.

## Guides

- [Writing sessions](docs/writing-sessions.md): the lines you type and what the plugin does with them.
- [Characters](docs/characters.md): sheets, bringing a character in from D&D Beyond, and leaving play.
- [Privacy](docs/privacy.md): what the plugin can read and write, and the one thing it sends.
- [Working on this project](docs/working-on-this.md): building, testing and releasing.

## Your notes stay yours

The plugin reads and writes only inside the one folder you choose for your campaigns. It sends nothing anywhere, unless you press the button that brings a character in from D&D Beyond. Your campaign is plain Markdown, and it still reads fine with the plugin turned off.

[MIT License](LICENSE)
