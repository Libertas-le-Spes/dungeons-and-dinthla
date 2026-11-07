# Note format

This page describes how a campaign is kept in plain Markdown notes. The plugin reads every note through it, and writes to notes only in the ways it lists. Every screen links here, and none invents its own storage.

The project grows in small steps, so parts of this page are still planned. Whoever's change makes any of it untrue updates it in the same change. The syntax is on trial: [Open for review](#open-for-review) lists the choices this page makes that are still to be settled.

Three rules hold everywhere:

- **The notes are the record.** Answers, statuses, holders and sheet values are all lines in notes. The plugin keeps nothing of its own, so a vault synced to a tablet carries everything with it.
- **Nothing you write is moved or rewritten.** A change is recorded as a new line that points back to the earlier one. The only edit the plugin makes to an existing line is adding a block id to its end (see [Pointing back](#pointing-back-to-an-earlier-line)).
- **It reads without the plugin.** With the plugin off, every note is still plain, sensible Markdown, and the links still work.

The plugin writes through `Vault.process`, so it never overwrites a note while you are typing in it. It uses only Obsidian's own vault access, so it works the same on mobile.

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
| `character` | Your own character, for a player |
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

**New session:** creates `Sessions/Session <highest + 1>.md` with `played` set to today. Nothing is copied into it. Open questions, active quests, the purse and every character carry over because the plugin reads every session, not just the latest.

## Lines

The plugin reads a line by its first character. Any other line is ordinary notes.

| Line | Read as |
|---|---|
| `? Who sent the letter` | A question |
| `! Find the missing caravan, from: [[Lady Vess]], reward: 200 gp` | A quest, with who gave it and the reward |
| `$ 35 gp 4 sp from the bandits at the ford` | Coin coming in |
| `$ Paid 5 gp to the ferryman`, `$ -5 gp ferry` | Coin going out |
| `$ [[Mira]] Flame Tongue longsword` | An item, held by the first linked name |
| `$ Potion of healing` | An item the party holds, with no one holding it yet |
| `?? letter`, `!! caravan`, `$$ lantern` | A lookup typed while writing, which finds an earlier question, quest or item. The plugin never reads it as a note |

`src/notes/` reads all of these today. [#62](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/pull/62) lists the exact rules: commas, links, signs and the five coin kinds.

### Quest facts

A quest's facts are `name: value` pairs after its title. Each one runs to the next fact or the next comma:

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

How the signs on a line with more than one amount work is still to be decided ([#68](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/issues/68)). The options are under [Open for review](#open-for-review).

## Pointing back to an earlier line

Answers, progress and changes are new lines that link to the line they follow. They use a block id: `^letter` at the end of the earlier line, and `[[Session 12#^letter|the letter]]` in the new one. With the plugin off, the link still opens the earlier line.

```markdown
? Who sent the letter ^letter
```

None of the lines in this section is read yet. Today `?+` and `?=` read as plain questions and `!+`, `!=` and `!x` as quests. `$>` and `$x` read as items held by *Session 12*, the first link on the line, and a `$x` with an amount reads as coin.

When a dialog writes a follow-up and the earlier line has no block id yet, the plugin adds one to its end, made from the line's first word that isn't a common word (`^letter`, `^caravan`) and made unique within the note. You may also type your own.

### Questions

| Line | Means |
|---|---|
| `?+ [[Session 12#^letter\|the letter]] it smelled of lantern oil` | A clue. The question stays open |
| `?= [[Session 12#^letter\|the letter]] [[Lady Vess]] sent it` | The answer. The question is answered |
| `? Who is the pale woman, after: [[Session 12#^letter\|the letter]]` | A new question that follows from the earlier one |

A question is open until it has a `?=` line. Reopening it removes that `?=` line.

### Quests

| Line | Means |
|---|---|
| `!+ [[Session 12#^caravan\|the caravan]] tracks lead to [[Old Mill]]` | Progress. The quest stays active |
| `!= [[Session 12#^caravan\|the caravan]] found it under the Old Mill` | Completed, with what happened |
| `!x [[Session 12#^caravan\|the caravan]] the wagons burned` | Failed or abandoned, with what happened |
| `! Escort [[Mira]] to the ferry, after: [[Session 12#^caravan\|the caravan]]` | A follow-up quest |
| `$ +200 gp reward for [[Session 12#^caravan\|the caravan]]` | The reward collected. It is coin in, and the quest counts as paid |

### Items

| Line | Means |
|---|---|
| `$> [[Session 12#^lantern\|silvered lantern]] [[Mira]]` | The item changes hands. Mira holds it from here on |
| `$x [[Session 12#^lantern\|silvered lantern]] sold, 30 gp` | Sold. The 30 gp is coin in |
| `$x [[Session 12#^potion\|potion]] used up` | Used up |
| `$x [[Session 12#^lantern\|silvered lantern]] lost` | Lost |

An item is held until it has a `$x` line, and `$x` lines fold away in the funds screen.

## Character

A character is one note in the campaign's `Characters` folder, named after them. Their sheet is a view built from lines that state facts about them. It is never stored on its own.

A fact is `name: value` after a link to the character, anywhere in the campaign:

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
| Carried over | On a character note in another campaign, which the character's note links with `carried from: [[Lost Mines/Characters/Mira]]` | Marked with that campaign's name. Anything learned in this campaign wins over it |
| Changed over time | More than one line states it | The newest value, with the earlier ones and their sessions on tap. A list value (languages, say) adds them up instead |

"Newest" means the highest session number, and then the lowest line in that note.

Renaming a character's note renames it: Obsidian rewrites every `[[link]]` to it.

## Open for review

These are the choices this page makes that differ from the prototype or the plan doc, or that neither settled. Each one gives the recommendation first.

1. **Answers and statuses are new lines, not changes to the old line.** The plan doc does this. Issue #17 instead suggested writing them into the line, as in `? Who sent the letter → [[Lady Vess]] sent it`.
   - *Recommended: new lines.* Nothing you wrote is rewritten, the session where it was learned is kept, and two devices editing different sessions can't clash.
   - *Into the line:* each question reads as one line. But a dialog has to rewrite an earlier session's note, and the answer loses the session it came from.
2. **The plugin adds block ids itself.** This is the one edit it makes to an existing line. The alternative is asking you to type `^letter` before a dialog can follow up, which is a chore on a tablet.
3. **A new session copies nothing in.** The plan doc copies open questions into the new note. Copying them would show each one twice, once in its own session and once in the copy. The prototype copies nothing, and the lists carry over by themselves.
4. **Signs on a `$` line with more than one amount** ([#68](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/issues/68)). Today one minus sign or money-out word turns every amount negative:

   | Line | Read today | (b) each amount on its own |
   |---|---|---|
   | `$ +50 gp reward, -5 gp ferry` | −55 gp | +45 gp |
   | `$ [[Lady Vess]] gave us 50 gp` | −50 gp | +50 gp (*gave* doesn't come right before the amount) |
   | `$ paid 5 gp, got 3 gp back` | −8 gp | −2 gp |

   - *Recommended: (b).* Each amount takes its own sign, or a money-out word right before it. This also suits `$ [[Thessaly]] +30 gp share`.
   - (a) keeps today's rule and explains it in the funds screen.
   - (c) counts a money-out word only when it starts the line.
5. **Item lines `$>` and `$x`** are new here. Neither the prototype nor the plan doc wrote item changes down.
6. **Override and carried over** come from where a fact's line is, rather than from a marker on the value. The plan doc gives the meanings but not the syntax.
7. **The characters gallery is a plain plugin view, not a custom Bases view.** Bases views (Obsidian 1.10, which is why `minAppVersion` is 1.10.3) list notes by their properties. The sheet values here are lines, so a Bases view would only add filtering by `type`. If it stays a plain view, `minAppVersion` can come down.
8. **Marked lines in bullets.** `- ? Who sent the letter` isn't read today, because the marker must be the first character. Recommended: read a marker after a leading `- `, since Obsidian lists are a common way to write.
