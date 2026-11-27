# Characters

Each character is a note in the campaign's `Characters` folder. Their sheet is built from what you write about them, so you never fill in a form.

## What the sheet shows

Write a character's link, then values, on any line of a session:

```markdown
[[Mira]] AC: 15, class: rogue
[[Brother Aldric]] HP: 22, speed: 30 ft.
```

The sheet reads `type`, `subtitle`, `speed`, `STR`, `DEX`, `CON`, `INT`, `WIS`, `CHA`, `class`, `AC`, `HP` and `alignment`, and shows any other name under the other values. Modifiers are worked out from the scores.

Each value shows where it came from:

| Shown as | Comes from |
|---|---|
| Learned | A line in a session. The sheet links to it |
| Not known yet | No line yet, or the newest line says `?` (`[[Mira]] HP: ?`) |
| Override | A line on the character's own note, such as `AC: 16` |
| Imported | D&D Beyond or its PDF (see below) |

Your override wins, then the imported value, then the newest value learned at the table. Tap a value on the sheet to change it in any of these ways. A value with earlier lines shows how many (↺ 2), and tapping it lists them.

Under the values, *In the notes* lists every session line that links to the character. Pressing a line opens it in its session.

## Making and changing a character

*New character* on the Characters page makes the note. *Edit character*, at the top of a sheet, renames it, changes its values or deletes it. Deleting takes a second press. Renaming updates links to the character if Obsidian's *Automatically update internal links* setting is on.

## Bringing a character in from D&D Beyond

Press *Import from D&D Beyond* on the Characters page. There are two ways:

- **Online:** paste your character's link or number and press *Bring in from D&D Beyond*. The character must be set to Public on D&D Beyond. The plugin asks for your agreement once before it sends anything; [Privacy](privacy.md) says exactly what is sent.
- **From a PDF:** on D&D Beyond, open your character, choose *Manage* next to the name, then *Export to PDF*. Choose that file in the same dialog. It is read on your device and nothing is sent.

Either way, you see what will be written before you press *Import*. The note gets the values and five sections: *Numbers*, *Inventory*, *Purse*, *Spells* and *Features*.

Online, D&D Beyond sends only base scores, bonuses and modifiers. The plugin works out the rest itself, such as armor class, hit points, saving throws and skills, and shows its working in *Numbers*. A number it can't work out stays *Not known yet* with the reason, rather than a guess. A score or hit points you set by hand on D&D Beyond win.

**After a level-up,** press *Update from D&D Beyond* on the sheet. A character brought in online remembers their D&D Beyond number, so the update starts straight away. You check the changes, then press *Update*. Lines you typed inside the imported sections are listed as a warning first, because an update replaces those sections.

**Items on the funds page:** press *Track on the funds page* beside an item in the sheet's inventory, and it goes on the Party funds page as held by that character. If an update no longer lists an item the funds page has for them, the sheet marks it, with *Used up*, *Sold*, *Lost* and *Changed* to settle it.

## Your character, backups and leaving play

The campaign's main note names your character in `character`. When you import a new character, or press *Make main* on another, the plugin asks what happened to the one you played:

- **Died** or **Retired:** their note moves to the campaign's `Fallen` folder, with a dated snapshot at the bottom: open questions, active quests, latest coin and items held. You can add what they were last doing.
- **Backup:** their note stays in `Characters`, listed under *Backups* on the Characters page.

To take a character out without bringing in another, press *Depart* at the bottom of their sheet. Choose *Died*, *Retired*, or write what happened under *Something else*, such as *Joined the Silver Order*.

Fallen characters are listed under *Fallen* on the Characters page. *Make main* brings one back to `Characters`, keeping their snapshots. If a switch stops part way, the message says what was done; press *Make main* again to finish it.

## The same character in another campaign

To use a character's values from another campaign, add two properties to their note in the new campaign:

```markdown
---
carried from: "[[Ashen Road/Characters/Mira]]"
carried: [abilities, values]
---
```

`abilities` carries the six scores and `values` carries everything else. Anything learned in the new campaign wins over a carried value.
