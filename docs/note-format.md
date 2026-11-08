# Note format

This page describes how a campaign is kept in plain Markdown notes. The plugin reads every note through it, and writes to notes only in the ways it lists. Every screen links here, and none invents its own storage.

The project grows in small steps, so parts of this page are still planned. Whoever's change makes any of it untrue updates it in the same change. The syntax is on trial and will change as it is used at the table.

Three rules hold everywhere:

- **The notes are the record.** Answers, statuses, holders and sheet values are all lines in notes. The plugin keeps nothing of its own but the campaign you were last in, so a vault synced to a tablet carries everything with it.
- **Nothing you write is moved or rewritten.** A change is recorded as a new line that names the earlier one (see [Following up](#following-up-an-earlier-line)). The plugin adds lines and never edits one, except a `$` ledger entry you change from the Funds view, or the price on an item's `:sold` line, which are rewritten where they stand. It deletes lines only when you ask it to: reopening a question or changing its answer removes the old answer line (two answers would leave the question unclear), setting a quest active again or changing its outcome removes the old outcome line, and deleting a question or quest removes it with its own follow-up lines. No change is written that would turn lines into a note's properties, as removing the line before a `---` at the top of a note could; the plugin refuses and says so. The one other change it makes to what you wrote is to a campaign's main note, when you change its background picture or wash in the plugin's settings (see [Campaign](#campaign)).
- **It reads without the plugin.** With the plugin off, every note is still plain, sensible Markdown, and the links still work.

The plugin writes through `Vault.process`, which reads and changes a note in one step, so nothing written in between is lost. It uses only Obsidian's own vault access, so it works the same on mobile.

## Campaign

A campaign is a top-level folder of the vault. Every note inside it, and in the folders inside it, belongs to the campaign.

The folder's main note sits at its top and has the folder's name. It is the campaign's dashboard, and its properties hold the campaign's settings:

```
Curse of the Pale Moon/
  Curse of the Pale Moon.md
  Characters.base
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

**Background:** every note in the campaign's folder, and in the folders inside it, shows the `background` picture behind its text, under a wash of the page colour. A subtle wash lets the least of the picture through and a strong one the most. A `background` that links anything but a picture (avif, bmp, gif, jpeg, jpg, png, svg or webp), or a picture no longer in the vault, shows nothing. Notes outside every campaign, and the plugin's own panels, keep the plain background.

**Campaign settings:** the plugin's page in Obsidian's settings shows the campaign you are in: its folder, its background picture and how much of the picture shows. The campaign you are in is the one whose note you opened last, or the one chosen on that page. The plugin keeps it in its own `data.json`, follows the folder when it is renamed, and starts in it next time unless a note of another campaign is open. Choosing a picture from the vault writes `background: "[[<picture>]]"` to the main note, **Remove picture** deletes the `background` property, and choosing how much shows writes `wash`. These writes go through Obsidian's own property editing, which writes the whole properties block again: comments in it can be lost, quoting can change, and a main note without properties gets a properties block at its top. The text below the properties is left as it is.

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

*Add coin* in the Funds view writes money in as `$ <amount> <what for>` and money out as `$ Paid <amount> <what for>`, into the session you're in. It shows how the line will be read as you type, and saves only if it reads back as exactly the money chosen. It refuses an amount with stray commas, a sign or money word that says the other way, an amount that comes to nothing, and `for:`, which marks a quest's reward collected. Tapping a `$` entry in the ledger opens it the same way: saving rewrites its line where it stands in its own note, keeping its bullet, and *Delete entry* removes it, each only if the line still says what was read, on the line it was read from, and the purse moves by exactly the difference. Saving with nothing changed writes nothing. The dialog only saves an entry it would write back word for word, as *Add coin* words it; any other, such as `$ Bought rope for 2 gp` or `$ +50 gp reward, -5 gp ferry`, can only be deleted there, so change it in its note, which *Open note* opens. A sale's entry belongs to its item's `$$` line, so while that sale is how the item went, tapping it opens the item instead, where its price can be corrected. Once a later line names the item again, tapping the sale opens its note.

## Following up an earlier line

Answers, progress and changes are new lines, written in the session where they happen. Each one starts with the earlier line's text and a colon, then says what happened:

```markdown
? Who sent the letter                           (Session 12)
?= Who sent the letter: [[Lady Vess]] sent it   (Session 13)
```

You don't type the earlier line's text. Type `?? letter` or `!! caravan` on its own line in a session note, and the plugin suggests the open questions or active quests holding every word typed, newest first, at most eight, with the words marked. Words are matched as the text reads, so a link matches by what it shows. Pick the line from the suggestions: the lookup line is removed and the question's or quest's dialog opens, as if you had tapped it in its view. Then choose what happened. The plugin then writes the follow-up line into the session you're in: the session note that is open, or else the campaign's latest. An open session earlier than the question, or than any of its clues or its answer, is passed over, since a follow-up is only read after the line it follows and a clue only while its question is open. You may also type one in full.

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

A question is open until it has a `?=` line. Reopening it removes that `?=` line; changing the answer replaces it with a new one in the same note, so later questions keep their clues; a follow-up typed with it still goes into the session you're in, and is refused if a question already reads like it. Before writing an answer, a reopening or a follow-up, the plugin reads the notes as they would be after the change, and writes nothing unless only this question changes as intended. A delete has no such check: it removes only the question's own lines, where they were read. Deleting a question removes its `?` line, its clues and its answer, wherever they were written. The plugin does each only when you ask. It removes a line only if it still says what was read, on the line it was read from; another line that reads the same is never taken in its place. If the question or the answer being replaced has changed or moved since it was read, it writes nothing and says so; deleting a question leaves any clue or answer line that was changed or moved since it was read, and says which notes kept them. Another line that reads like the question is never deleted with it. An answer that would be read as another open question's, because that question starts the same way, is refused. An answer can't be given from the view while an earlier open question reads the same, since the answer would go to that one.

*New question* in the Questions view adds `? …`, and `?= …` if an answer is given, to the campaign's latest session, so the new lines are read after every other. It refuses a question that reads the same as one already asked, open or answered, since their answers would be mixed up, and an answer that would be read as another question's.

### Quests

| Line | Means |
|---|---|
| `!+ Find the missing caravan: tracks lead to [[Old Mill]]` | Progress. The quest stays active |
| `!= Find the missing caravan: found it under the Old Mill` | Completed, with what happened |
| `!x Find the missing caravan: the wagons burned` | Failed or abandoned, with what happened |
| `! Escort [[Mira]] to the ferry, after: Find the missing caravan` | A follow-up quest |
| `$ +200 gp reward, for: Find the missing caravan` | The reward collected. It is coin in, and the quest counts as paid |

Tapping a quest in the Quests view opens it to note progress, complete or abandon it with what happened, collect a coin reward, or open a follow-up quest. Each writes the line above into the session you're in, as answers are. Setting a finished quest active again removes its outcome line, and changing the outcome replaces it. A coin reward of one amount is offered until a `$ … for: <quest>` line for it exists, so it can't be collected twice, and not at all when the quest's own title holds an amount the reward line would also count. Quests sharing a title share that check, and a reward already written by hand in other words isn't recognised, so switch the toggle off for it. A changed outcome is written in the old outcome's note, so a later quest of the same title keeps its lines. Deleting a quest removes it with its progress and outcome lines. The same refusals hold as for questions: a line changed since the dialog opened, an earlier active quest with the same title, or a note that would read as about another quest. Before writing, the plugin reads the notes as they would be after the change, and writes nothing unless only this quest changes as intended and the purse moves by exactly the reward. Deleting a quest leaves its reward line and its follow-up quests.

*New quest* in the Quests view adds `! <quest>, from: <giver>, reward: <reward>` to the campaign's latest session, so it is read after every other line. *Given by* suggests the campaign's characters; one with a note is linked, by its full path if another note shares its name. It refuses a title already used, and a quest that would read back differently from what was typed, such as one with `from:` or `reward:` in a field.

### Items

The plugin doesn't keep an inventory. It keeps the items that matter to the party, from what you write about them. An item line starts with `$$`, then the item's name, then a space, a colon and one of `changed to`, `sold`, `used` or `lost`. A colon inside the name (`Ring: +1`) is part of the name, because only the last ` :` before one of those words counts:

| Line | Means |
|---|---|
| `$$ Silvered lantern :changed to [[Mira]]` | Mira holds it from here on. The funds screen shows who held it before |
| `$$ Silvered lantern :changed to the party` | The party holds it again |
| `$$ Silvered lantern :sold 30gp` | Sold. The 30 gp goes into the purse |
| `$$ Potion of healing :used` | Used up |
| `$$ Silvered lantern :lost` | Lost |

A `$$` line needs no earlier line about the item. `$$ Potion of healing :used` on its own says the party had a potion and used it, whether or not anyone wrote it down when it was found. An item is held from the first line that names it until a `:sold`, `:used` or `:lost` line, and gone items fold away in the funds screen.

Tapping an item in the Funds view opens it: who holds it, and whether it is held, sold, used up or lost, with a price for a sale. A new holder or status is written as one of the `$$` lines above, naming the item as it was written, link and all, into the session you're in, passing over an open session earlier than the item's last line. A holder is written the way it was last written: one written in plain text, as in `:changed to Old Tom`, stays plain text, so no link to a missing note appears, and a linked one stays a link. A holder with a note in the campaign's `Characters` folder is offered as a link to it. Setting a gone item held again removes the line that took it, with its sale; an item named only by that line gets a `:changed to` line instead, so it stays. Changing how an item went replaces that line. *Sold for* shows a sold item's price as its line writes it, or nothing when the dialog couldn't write that line, such as `:sold -5 gp`. Correcting the price rewrites the `:sold` line where it stands, keeping its bullet and the words before ` :sold`; leaving the price as it was, or writing the same amount another way, writes nothing. Each is done only when that line says no more than the dialog writes, like `$$ Lantern :sold 30 gp`, and still reads as it did, on the line it was read from; for one with more words, change it in its note, which the dialog then offers to open. The dialog works from the notes as they were when it opened. Before it writes, it reads the session notes again: if they changed while the dialog was open in a way that changes how the item reads, even by one of its lines moving, it writes nothing and says so. Saving with nothing changed still writes nothing. A gone item can't be given to someone else while it stays gone, since the new holder's line would bring it back. Before writing, the plugin reads the notes as they would be after the change, and writes nothing unless every item comes out as asked and the purse moves by exactly the sale, or by the difference a corrected price makes.

How much an item matters is shown by how you write it:

| How it's written | What it is | On the funds screen |
|---|---|---|
| `found some rope` (no marker) | Doesn't matter | Not listed. It's just notes |
| `$ Potion of healing` | Matters for now | Listed, and folds away by itself after 3 sessions in which no line names it. Any later line about it brings it back |
| `$ [[Silvered lantern]]` | Matters to the campaign | Pinned at the top until a `:sold`, `:used` or `:lost` line. It has its own note in the campaign's `Items` folder, for its story, which Obsidian creates the first time you follow the link. It shows in Obsidian's graph |

An item can move up at any time: writing it once as `[[Potion of healing]]` makes it a key item from then on. `$$` lines take a linked name too: `$$ [[Silvered lantern]] :sold 30gp`. A linked and a plain name for the same item match, so `$$ Silvered lantern :sold 30gp` sells the key item as well.

A `$` line can hold two links, as in `$ [[Mira]] [[Flame Tongue]]`. A link to a note in the campaign's `Characters` folder is the holder, and any other link is the item. A link to a note that doesn't exist yet is the item, since anyone holding things has a sheet.

Telling the holder from the item isn't read yet, and neither is how much an item matters. Today the first link on a `$` line is always the holder, so `$ [[Silvered lantern]]` alone reads as nothing.

A block id at the end of an item line, as in `$ Rope ^r1` or `$$ Rope :changed to Old Tom ^r2`, is Obsidian's, not part of the item's name or its holder, so the dialog writes `$$ Rope …`. One left before the change word, as in `$$ Rope ^r1 :changed to [[Mira]]`, which earlier versions of the dialog wrote, isn't part of the name either. A `^` needs a space before it to start a block id. A line that took an item and ends in a block id says more than the dialog writes, so it is changed in its note, where the block id can be kept.

Typing `$$ lan` suggests the items held now that match, with who holds them, the same way, and picking one opens the item's dialog; once a ` :` and a change word follow, the line is an item line and no longer a lookup. Names match whatever their capitals and spacing. A name that is one link matches by the note it points to, whatever the link's alias or folder, while a longer name that holds a link (`+1 [[Longsword]]`) is a different item. A `$$` line with no `:` yet is still being typed and is read as nothing.

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

A name is letters and spaces, read whatever its capitals (`ac:` is `AC`). A value runs to the next comma that a name and a colon follow, so the comma in `type: Medium humanoid (human), lawful good` stays in the type, and a name with nothing after its colon states nothing. Learned values and overrides are read today, each with the note and line it came from, with an override winning over anything learned and the newest line winning among the rest. A session's properties are never read as facts, and a link counts for the note Obsidian resolves it to, so `[[Mira]]` and `[[Characters/Mira|her]]` state facts about the same character. Carried-over values, earlier values and list values that add up aren't read yet.

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

The gallery is a view the plugin adds to Obsidian's Bases. Each campaign gets a `Characters.base` file at its top, showing the Markdown notes in its `Characters` folder, so Bases does the filtering, sorting and refreshing, and the plugin draws each card from the lines above. If Bases is turned off in the vault, the plugin says so and asks for it to be turned on, which is why `minAppVersion` is 1.10.3.

*Open characters*, from the ribbon or the command palette, opens the campaign's `Characters.base`. The first time, it writes the file:

```yaml
filters:
  and:
    - 'file.inFolder("Curse of the Pale Moon/Characters")'
    - 'file.ext == "md"'
views:
  - type: dungeons-and-dinthla-characters
    name: Characters
```

It never writes the file again, so a filter, sort or view added to it in Bases stays. If it already exists by the time the plugin writes it, from a second tap say, the plugin opens that one. A new note in the `Characters` folder shows up as a card at once.

Each card is a short stat block: the character's name, their `type` and `subtitle` when known, then `class`, `AC`, `HP` and `speed`, and the six ability scores with their modifiers. A value no line states shows as `?`. Each card reads the sessions of the campaign its note is in, even while another campaign is open, and a note outside any campaign shows only its own overrides. The player's own character, named by a link in the campaign note's `character` property, is marked *Your character*, and changing that property redraws the gallery. Tapping a card opens the character's note, until their sheet is built.
