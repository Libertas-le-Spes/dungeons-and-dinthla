# Note format

This page describes how a campaign is kept in plain Markdown notes. The plugin reads every note through it, and writes to notes only in the ways it lists. Every screen links here, and none invents its own storage.

The project grows in small steps, so parts of this page are still planned. Whoever's change makes any of it untrue updates it in the same change. The syntax is on trial and will change as it is used at the table.

Three rules hold everywhere:

- **The notes are the record.** Answers, statuses, holders and sheet values are all lines in notes. The plugin keeps nothing of its own, so a vault synced to a tablet carries everything with it.
- **Nothing you write is moved or rewritten.** A change is recorded as a new line that names the earlier one (see [Following up](#following-up-an-earlier-line)). The plugin adds lines and never edits one. It deletes lines only when you ask it to: reopening a question or changing its answer removes the old answer line, and deleting a question removes it with its clues and answer.
- **It reads without the plugin.** With the plugin off, every note is still plain, sensible Markdown, and the links still work.

The plugin writes through `Vault.process`, which reads and changes a note in one step, so nothing written in between is lost. It uses only Obsidian's own vault access, so it works the same on mobile.

## Campaign

A campaign is a top-level folder of the vault. Every note inside it, and in the folders inside it, belongs to the campaign.

The folder's main note sits at its top and has the folder's name. It is the campaign's dashboard, and its properties hold the campaign's settings:

```
Curse of the Pale Moon/
  Curse of the Pale Moon.md
  Sessions/
    Session 12.md
    Session 13.md
  Characters/
    Mira.md
    Brother Aldric.md
  Items/
    Silvered lantern.md
```

```markdown
---
role: player
character: "[[Thessaly]]"
party:
  - "[[Thessaly]]"
  - "[[Mira]]"
system: "[[D&D 5e]]"
background: "[[pale-moon.jpg]]"
wash: balanced
---
```

| Property | What it holds |
|---|---|
| `role` | `player`, `dm` or `researcher` |
| `character` | Your own character, for a player. The dashboard links to their sheet, and the characters gallery sets them subtly apart from everyone else |
| `party` | The party members, used by `$ split` |
| `system` | The note that describes the game system |
| `background` | A picture in the vault, shown behind every note of the campaign |
| `wash` | How much of the picture shows: `subtle`, `balanced` (the default) or `strong` |

Renaming the folder renames the campaign. Obsidian renames the main note's links along with it.

## Session

A session is one note in the campaign's `Sessions` folder, named `Session <number>`. The number sets the order: the newest session is the one with the highest number.

```markdown
---
played: 2026-03-14
title: The ferry at dusk
---

Tracks lead to the [[Old Mill]].
? Why does the Old Mill wheel turn at night
! Find the missing caravan, from: [[Lady Vess]], reward: 200 gp
$ 35 gp 4 sp from the bandits at the ford
```

| Property | What it holds |
|---|---|
| `played` | The date it was played, `YYYY-MM-DD` |
| `title` | Optional. Screens show *Session 13 · The ferry at dusk* |

**New session:** creates `Sessions/Session <highest + 1>.md` with `played` (the date chosen, today by default) and, if one is given, `title`. Nothing else is copied into it.

**What's still open:** above its own text, every session note shows the questions and quests that were still open when it began, wherever they were written. The plugin draws this from the earlier sessions each time the note is opened, the way a character from Session 1 shows on their sheet in Session 30. It is never written into the note, so nothing appears twice, and an answer written in Session 13 shows up everywhere at once.

## Lines

The plugin reads a line by its first character. A list bullet (`- `, `* ` or `+ `) and indentation before it are skipped, so `- ? Who sent the letter` is a question too. A task checkbox (`- [ ] ? …`) or a numbered list item is not skipped, so those lines stay ordinary notes. Any other line is ordinary notes, apart from [character facts](#character).

| Line | Read as |
|---|---|
| `? Who sent the letter` | A question |
| `! Find the missing caravan, from: [[Lady Vess]], reward: 200 gp` | A quest, with who gave it and the reward |
| `$ 35 gp 4 sp from the bandits at the ford` | Coin coming in |
| `$ Paid 5 gp to the ferryman`, `$ -5 gp ferry` | Coin going out |
| `$ [[Mira]] Flame Tongue longsword` | An item, held by the linked character (see [Items](#items)) |
| `$ Potion of healing` | An item the party holds, with no one holding it yet |
| `?? letter`, `!! caravan` | A lookup typed while writing, which finds an earlier question or quest. The plugin never reads it as a note |
| `$$ Silvered lantern :sold 30gp` | Something happened to an item ([Items](#items)) |

`src/notes/` reads all of these today, and `src/campaign/` builds a campaign from the session notes in its folder, in session order. [#62](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/pull/62) lists the exact rules: commas, links, signs and the five coin kinds.

### Quest facts

A quest's facts are `name: value` pairs after its title, with the name in any letter case (`From:` reads like `from:`). Each one runs to the next fact or the next comma. As with money, a comma between two digits or inside a `[[link]]` doesn't end it, so `reward: 1,200 gp` and `from: [[Vess, Lady]]` stay whole:

| Fact | Holds | Read today |
|---|---|---|
| `from:` | Who gave the quest | Yes |
| `reward:` | What it pays | Yes |
| `where:` | Where it leads | Not yet |
| `due:` | When it must be done by | Not yet |

### Money

| Line | Read as | Read today |
|---|---|---|
| `$ +120 gp sold the wagon` | +120 gp | Yes |
| `$ [[Thessaly]] +30 gp share` | +30 gp, held by Thessaly | No: read as coin with no holder |
| `$ split 120 gp, [[Mira]] 60 gp` | 120 gp shared among the `party`, Mira's share set to 60 gp | No |
| `$ = 85 gp` | The purse counted: it holds 85 gp from here on | No: read as +85 gp |
| `$ [[Mira]] = 40 gp` | Mira's own purse counted | No |

Each amount on a line counts on its own ([#68](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/issues/68)). An amount is money out when it has its own minus sign, or when *paid*, *spent*, *bought*, *gave* or *lost* comes before it, up to the next comma. A comma between two digits is part of the number, so `paid 1,200 gp` is −1,200 gp, and a comma inside a `[[link]]` is part of the name. A money-out word inside a link is part of a name too, so `$ reward from [[Lost Hollow]] 5 gp` is +5 gp. A sign always wins over a word.

| Line | Read as |
|---|---|
| `$ +50 gp reward, -5 gp ferry` | +45 gp |
| `$ paid 5 gp, got 3 gp back` | −2 gp |
| `$ Bought rope for 2 gp` | −2 gp |
| `$ [[Lady Vess]] gave us 50 gp` | −50 gp: write `+50 gp` when someone gives the party money |

## Following up an earlier line

Answers, progress and changes are new lines, written in the session where they happen. Each one starts with the earlier line's text and a colon, then says what happened:

```markdown
? Who sent the letter                           (Session 12)
?= Who sent the letter: [[Lady Vess]] sent it   (Session 13)
```

You don't type the earlier line's text. Type `?? letter` or `!! caravan`, pick the line from the suggestions, and choose what happened, or tap the question in the Questions view. The plugin then writes the follow-up line into the session you're in: the session note that is open, or else the campaign's latest. You may also type one in full.

A follow-up belongs to the open question or active quest whose text comes right before its colon: `?= Who sent the letter: …` belongs to *Who sent the letter*, never to a shorter *Who*. When the line holds more than one colon, the longest text that matches wins, so a colon inside a question's own text does no harm. For a quest the text is its title, without its facts (`from:`, `reward:`, `where:`, `due:`).

If an earlier line is reworded, its follow-ups no longer match it. The plugin marks a follow-up that matches nothing, so either line can be fixed.

`?+`, `?=`, `!+`, `!=`, `!x` and `$$` lines are read and matched today. `!x` needs a space or the end of the line after it, so a quest can still start with an x. Some parts aren't read yet:

- `after:`, `where:` and `due:` stay part of the question's text or the quest's title, so a follow-up has to include them to match.
- A `for:` line counts as coin in without marking the quest paid.
- A follow-up that matches nothing is collected but not marked yet.

A follow-up typed in full must match the earlier text exactly, capitals included.

### Questions

| Line | Means |
|---|---|
| `?+ Who sent the letter: it smelled of lantern oil` | A clue. The question stays open |
| `?= Who sent the letter: [[Lady Vess]] sent it` | The answer. The question is answered |
| `? Who is the pale woman, after: Who sent the letter` | A new question that follows from the earlier one |

A question is open until it has a `?=` line. Reopening it removes that `?=` line; changing the answer removes it and writes a new one. Deleting a question removes its `?` line, its clues and its answer, wherever they were written. The plugin does each only when you ask, and removes a line only if it still says what was read.

### Quests

| Line | Means |
|---|---|
| `!+ Find the missing caravan: tracks lead to [[Old Mill]]` | Progress. The quest stays active |
| `!= Find the missing caravan: found it under the Old Mill` | Completed, with what happened |
| `!x Find the missing caravan: the wagons burned` | Failed or abandoned, with what happened |
| `! Escort [[Mira]] to the ferry, after: Find the missing caravan` | A follow-up quest |
| `$ +200 gp reward, for: Find the missing caravan` | The reward collected. It is coin in, and the quest counts as paid |

### Items

The plugin doesn't keep an inventory. It keeps the items that matter to the party, from what you write about them. An item line starts with `$$`, then the item's name, then a space, a colon and one of `changed to`, `sold`, `used` or `lost`. A colon inside the name (`Ring: +1`) is part of the name, because only the last ` :` before one of those words counts:

| Line | Means |
|---|---|
| `$$ Silvered lantern :changed to [[Mira]]` | Mira holds it from here on. The funds screen shows who held it before |
| `$$ Silvered lantern :sold 30gp` | Sold. The 30 gp goes into the purse |
| `$$ Potion of healing :used` | Used up |
| `$$ Silvered lantern :lost` | Lost |

A `$$` line needs no earlier line about the item. `$$ Potion of healing :used` on its own says the party had a potion and used it, whether or not anyone wrote it down when it was found. An item is held from the first line that names it until a `:sold`, `:used` or `:lost` line, and gone items fold away in the funds screen.

How much an item matters is shown by how you write it:

| How it's written | What it is | On the funds screen |
|---|---|---|
| `found some rope` (no marker) | Doesn't matter | Not listed. It's just notes |
| `$ Potion of healing` | Matters for now | Listed, and folds away by itself after 3 sessions in which no line names it. Any later line about it brings it back |
| `$ [[Silvered lantern]]` | Matters to the campaign | Pinned at the top until a `:sold`, `:used` or `:lost` line. It has its own note in the campaign's `Items` folder, for its story, which Obsidian creates the first time you follow the link. It shows in Obsidian's graph |

An item can move up at any time: writing it once as `[[Potion of healing]]` makes it a key item from then on. `$$` lines take a linked name too: `$$ [[Silvered lantern]] :sold 30gp`. A linked and a plain name for the same item match, so `$$ Silvered lantern :sold 30gp` sells the key item as well.

A `$` line can hold two links, as in `$ [[Mira]] [[Flame Tongue]]`. A link to a note in the campaign's `Characters` folder is the holder, and any other link is the item. A link to a note that doesn't exist yet is the item, since anyone holding things has a sheet.

Telling the holder from the item isn't read yet, and neither is how much an item matters. Today the first link on a `$` line is always the holder, so `$ [[Silvered lantern]]` alone reads as nothing.

Typing `$$ lan` suggests the items already named, so the name matches. Names match whatever their capitals and spacing. A name that is one link matches by the note it points to, whatever the link's alias or folder, while a longer name that holds a link (`+1 [[Longsword]]`) is a different item. A `$$` line with no `:` yet is still being typed and is read as nothing.

## Character

A character is one note in the campaign's `Characters` folder, named after them. Their sheet is a view built from lines that state facts about them. It is never stored on its own.

A fact line starts with a link to the character, followed by `name: value` pairs. It has no marker: the `from:` and `reward:` on a quest line are quest facts, never character facts. Fact lines count in session notes and on the character's own note, where the link is left out (`AC: 16`). Anywhere else they are ordinary notes.

```markdown
[[Mira]] AC: 15, class: rogue
[[Brother Aldric]] type: Medium humanoid (human), lawful good
```

The sheet reads these names: `type`, `subtitle`, `speed`, `STR`, `DEX`, `CON`, `INT`, `WIS`, `CHA`, `class`, `AC`, `HP` and `alignment`. Any other name shows under the sheet's other values. Modifiers are worked out from the scores, never written.

Each value has a state, which comes from where its line is:

| State | Where the line is | On the sheet |
|---|---|---|
| Learned | In a session note | The value, linked to that session |
| Not known yet | No line states it | Greyed out, with `?` |
| Override | On the character's own note, at the start of a line (`AC: 16`) | Marked so it never passes for something you saw |
| Carried over | On a character note in another campaign, named by the character's `carried from` property (see [Calling a character over](#calling-a-character-over)) | Marked with that campaign's name. Anything learned in this campaign wins over it |
| Changed over time | More than one line states it | The newest value, with the earlier ones and their sessions on tap. A list value (languages, say) adds them up instead |

"Newest" means the highest session number, and then the lowest line in that note.

Renaming a character's note renames it: Obsidian rewrites every `[[link]]` to it.

### Calling a character over

Calling a character into another campaign is a choice, made in a dialog: everything, only the groups you pick (ability scores, other values, history), or only a link. The new campaign's note for them records it in two properties:

```markdown
---
carried from: "[[Ashen Road/Characters/Mira]]"
carried: [abilities, values]
---
```

Only the groups listed in `carried` show on the sheet as carried over. The same dialog works as a library: it can call over anyone from any other campaign, or from the game system's own notes, which are there before the first campaign.

### Characters gallery

The gallery is a view the plugin adds to Obsidian's Bases. Each campaign gets a `Characters.base` file showing the notes in its `Characters` folder, so Bases does the filtering, sorting and refreshing, and the plugin draws each card from the lines above. If Bases is turned off in the vault, the plugin says so and asks for it to be turned on, which is why `minAppVersion` is 1.10.3.
