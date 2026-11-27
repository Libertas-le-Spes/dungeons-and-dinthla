# Writing sessions

A campaign is plain Markdown notes. You write short lines during play, and the plugin reads them to keep track of questions, quests, money and items.

## A campaign's folders

A campaign is a folder inside your Campaigns folder, with a main note of the same name:

```
D&D/
  Curse of the Pale Moon/
    Curse of the Pale Moon.md
    Sessions/Session 1.md
    Characters/Mira.md
```

The plugin makes the other folders (`Items`, `Places`, `Questions`, `Quests`, `Funds`, `Fallen`) when it needs them.

The main note's properties hold the campaign's settings:

| Property | What it does |
|---|---|
| `character` | A link to your own character, such as `"[[Mira]]"`. They show first, and their coin and items go in the *Mine* tab of Party funds |
| `role` | `dm` makes the plugin ask what each new name is, instead of working it out (see [A DM's campaign](#a-dms-campaign)) |
| `background` | A picture from the Campaigns folder, shown behind the campaign tab |
| `wash` | How much of that picture shows: `subtle`, `balanced` or `strong` |

The plugin's settings can set the background picture and wash for you.

## Sessions

Press *New session* to start one. It makes `Sessions/Session <number>.md`, and the highest number is the latest session. You can give it a date and a title:

```markdown
---
played: 2026-03-14
title: The ferry at dusk
---
```

Write in the box on the *Session notes* page and press *Save* (or Ctrl + Enter, Cmd + Enter on a Mac). The lines are added to the end of the note. What you type but haven't saved is kept on that device, even if Obsidian closes.

*Edit all* on the same page shows the whole note to fix what's already written. *Clear notes* empties a session and *Delete session* moves it to the trash; both ask first.

## The lines

The first character of a line says what it is. A list bullet before it (`- ? …`) is fine.

| Line | Means |
|---|---|
| `? Who sent the letter` | A question |
| `! Find the caravan, from: [[Lady Vess]], reward: 200 gp` | A quest, with who gave it and the reward |
| `$ 35 gp 4 sp from the bandits` | Coin in |
| `$ Paid 5 gp to the ferryman` or `$ -5 gp ferry` | Coin out |
| `$ [[Mira]] Silvered lantern` | An item, held by Mira |
| `$ Potion of healing` | An item the party holds |

Coin goes out when an amount has a minus sign, or when *paid*, *spent*, *bought*, *gave* or *lost* comes before it. So when someone gives the party money, write `+50 gp`, not `gave us 50 gp`.

Each session note also shows, above its own lines, the questions and quests that were still open when it began.

## Following up an earlier line

An answer, a clue or a change is a new line in the session where it happens. It starts with the earlier line's text and a colon.

| Line | Means |
|---|---|
| `?+ Who sent the letter: it smelled of lantern oil` | A clue. The question stays open |
| `?= Who sent the letter: [[Lady Vess]] sent it` | The answer |
| `!+ Find the caravan: tracks lead to the mill` | Progress on the quest |
| `!= Find the caravan: found it under the mill` | Quest completed |
| `!x Find the caravan: the wagons burned` | Quest failed or abandoned |

You don't need to type the earlier line. In the *Session notes* box, type `??`, `!!` or `$$` and a word or two (`?? letter`). The plugin suggests matching questions, quests or items; pick one and choose what happened. Tapping a question, quest, coin entry or item anywhere in the campaign tab opens the same dialog.

A follow-up typed by hand must match the earlier text exactly. If you reword the earlier line, its follow-ups no longer match it, so change both.

## Items

An item is held from the first line that names it. A `$$` line says what happened to it:

| Line | Means |
|---|---|
| `$$ Silvered lantern :changed to [[Mira]]` | Mira holds it now |
| `$$ Silvered lantern :changed to the party` | The party holds it again |
| `$$ Silvered lantern :sold 30gp` | Sold. The 30 gp goes into the purse |
| `$$ Potion of healing :used` | Used up |
| `$$ Silvered lantern :lost` | Lost |

Add a count with `x`: `$ [[Mira]] Dagger x5` gives Mira five daggers, and `$$ Dagger x2 :used` uses two of them. To take from one holder when several hold the item, link them on the line: `$$ Arrow x2 [[Mira]] :used`.

The *Party funds* page shows the purse, the items and every coin line, in two tabs: *Mine* for your character and *Party* for everyone else.

## Notes the plugin makes for you

Your session lines are the record. The plugin also makes some notes from them, and never touches the text you write below a note's properties.

- **Per session:** each session's `?`, `!` and `$` lines are copied into `Questions/Session 2.md`, `Quests/Session 2.md` and `Funds/Session 2.md`, linked back to the session.
- **Items:** an item named on three or more lines gets `Items/<item>.md`, listing those lines and who holds it.
- **People and places:** a name linked on three or more `?`, `!` or `$` lines gets a note in `Characters` or `Places`, if it doesn't have one yet. A link after `from:` on a quest, or the holder on an item line, is a person; `@[[Old Mill]]` is a place. When no line says which a name is, the plugin asks you after the save: *Character* or *Place*.

These notes are made when you save a session on this device, not when changes arrive by sync. If one stops matching its session, the plugin offers *Fix*.

## A DM's campaign

With `role: dm` in the main note, the plugin doesn't work out what a name is. Any link on three or more lines is asked about after a save, *Character* or *Place*, and your answer makes the note.
