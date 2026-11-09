# Note format

This page describes how a campaign is kept in plain Markdown notes. The plugin reads every note through it, and writes to notes only in the ways it lists. Every screen links here, and none invents its own storage.

This page changes as the project does. The project grows in small steps, so parts of this page are still planned. Whoever's change makes any of it untrue updates it in the same change. The syntax is on trial and will change as it is used at the table.

Three rules hold everywhere:

- **The notes are the record.** Answers, statuses, holders and sheet values are all lines in notes. The plugin keeps nothing of its own but the [Campaigns folder](#the-campaigns-folder) you chose, the campaign you were last in, whether its [welcome page](#welcome-page) is done with, and the last version whose [news](#whats-new) you saw, so a vault synced to a tablet carries everything with it.
- **Nothing you write is moved or rewritten.** A change is recorded as a new line that names the earlier one (see [Following up](#following-up-an-earlier-line)). The plugin adds lines and never edits one, except a `$` ledger entry you change from the Party funds page, or the price on an item's `:sold` line, or a value's line on a character's own note that you change in the character dialog or on their sheet, which are rewritten where they stand, or the whole text of a note you change and save on its [note page](#note-page), or of a session you change and save with *Edit all* on the [Session notes](#session-notes-page) page (see [Making, renaming and deleting a character](#making-renaming-and-deleting-a-character) and [Character sheet](#character-sheet)). It deletes lines only when you ask it to: *Clear notes* on the Session notes page empties a session below its properties, *Delete session* moves its note to the trash, clearing a value in the character dialog, or clearing an override from the sheet, removes the lines on the character's note that state it on their own, reopening a question or changing its answer removes the old answer line (two answers would leave the question unclear), setting a quest active again or changing its outcome removes the old outcome line, and deleting a question or quest removes it with its own follow-up lines. No change is written that would turn lines into a note's properties, as removing the line before a `---` at the top of a note could; the plugin refuses and says so. The one other change it makes to what you wrote is to a campaign's main note, when you change its background picture or wash in the plugin's settings (see [Campaign](#campaign)).
- **It reads without the plugin.** With the plugin off, every note is still plain, sensible Markdown, and the links still work.

The plugin writes through `Vault.process`, which reads and changes a note in one step, so nothing written in between is lost. It uses only Obsidian's own vault access, so it works the same on mobile.

## The Campaigns folder

The plugin works inside one folder of the vault, the **Campaigns folder**, and leaves the rest of the vault alone, apart from the links Obsidian updates when a character is renamed (below). It is any folder at any depth, such as `D&D` or `Games/D&D`, chosen in the plugin's settings (*Campaigns folder*, *Choose folder*) or on the [welcome page](#welcome-page), which can also make it. There is no default: until one is chosen, nothing is a campaign and the plugin reads and writes nothing. The vault itself can't be the Campaigns folder, nor can a hidden folder (one whose name starts with a dot, such as the vault's own `.obsidian`), the vault's settings folder or a folder inside them, and a path with `..`, a backslash, a slash at its start or a part ending in a dot or a space (which Windows trims, so `.. ` would climb out) is refused. The plugin keeps the path in its own `data.json`; a saved path that breaks these rules is dropped, which leaves the plugin touching nothing until one is chosen again.

- **Only inside.** Every read, write, new note or folder, rename, trash, listing, file event and lookup of Obsidian's file metadata goes through one gatekeeper (`src/fence/`, entered through `Gatekeeper`; a test reads the plugin's source as TypeScript and fails the build if any other file reaches the vault, or if any file writes through Obsidian's editor or a note's view), which checks the path is inside the Campaigns folder and refuses anything else, including a path that climbs out with `..`. A path the plugin makes, for a new note or folder or a rename, must also be written as Obsidian writes it, with every part a name a file can have; a file already in the vault needn't be, so a note such as `Zoë.md` written in decomposed letters by a Mac or a sync, or a name with a pasted no-break space, still shows. The one exception: a file or folder whose name ends in a dot or a space, such as the folder in `D&D/Pale Moon/Places./Inn.md`, is left out without a word, with everything inside it. Windows drops that ending, so a part such as `.. ` would climb out of the Campaigns folder, and the plugin refuses every such part rather than tell them apart. Such a file shows in no list, its changes are ignored, and the plugin never reads or writes it; rename it in Obsidian's file list to bring it in. A refused write or read fails with a message; a refused lookup finds nothing. Files outside the Campaigns folder don't show in any list, and changes to them are ignored.
- **Links that lead out.** To the plugin, a link in a campaign note to a note or picture outside the Campaigns folder is a link to a note that doesn't exist: a `background` picture outside it shows nothing, and a character there has no sheet. Following such a link opens the note in Obsidian as usual; the plugin never reads it, and it changes only when Obsidian updates its links to a renamed character.
- **Renaming a character.** Renaming a character uses Obsidian's rename. If *Automatically update internal links* is on in Obsidian's settings, Obsidian also updates links to that character in notes outside the Campaigns folder.
- **Opening files.** Only files inside the Campaigns folder can open in the campaign tab. Every other file opens in Obsidian as normal.
- **Moving out.** A note moved out of the Campaigns folder is outside the plugin's reach: to the plugin it is deleted, and it never learns where it went. Its note page can't save it any more, and *Open in Obsidian's editor* opens nothing; open it from Obsidian's file list. Lines typed for a session moved out are kept as for a deleted session. When the campaign you are in is moved out (or deleted), no campaign is open until you open a note of another one; the campaign you were in is never followed out of the Campaigns folder, and a campaign saved in `data.json` that isn't inside the Campaigns folder is dropped when the plugin starts.
- **Changing it moves nothing.** Choosing another Campaigns folder only changes where the plugin looks. Then, as when Obsidian starts, the campaign of the open note opens if it is in the new folder, or else the campaign you were in, or else the first campaign there; with none there, no campaign is open. Renaming the Campaigns folder in Obsidian doesn't follow it: choose it again.
- **No network.** Every pull request and release checks the two built files the release publishes for known kinds of network code, and fails if it finds any. In `main.js`: any module but `obsidian`, `@codemirror/state` and `@codemirror/view`; any `http`, `https`, `ws` or `wss` address, or one starting `//`, but the app's own `app://` and capacitor localhost file addresses; `fetch`, `request`, `requestUrl`, `ajax`, `ajaxPromise`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon`, `RTCPeerConnection`, `Image`, `Worker`, `SharedWorker`, `importScripts`, `import(`, `open` on a window, `location`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `srcdoc`, and `img`, `link`, `script` or `iframe` elements. In `styles.css`: any `url(` but a base64 data URL, `@import`, any web address, and escaped letters that could spell either. It looks for known patterns; it is not a proof, and code written to hide from it could get past.

## Campaign

A campaign is a folder directly inside the [Campaigns folder](#the-campaigns-folder). Every note inside it, and in the folders inside it, belongs to the campaign. A folder deeper down, or a note directly in the Campaigns folder, is not a campaign.

The folder's main note sits at its top and has the folder's name. Its properties hold the campaign's settings:

```
D&D/
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
| `character` | Your own character, for a player. The dashboard and the Characters page show them first, before everyone else, and set them subtly apart |
| `party` | The party members, used by `$ split` |
| `system` | The note that describes the game system |
| `background` | A picture in the Campaigns folder, shown behind the campaign tab |
| `wash` | How much of the picture shows: `subtle`, `balanced` (the default) or `strong` |

Renaming the folder renames the campaign. Obsidian renames the main note's links along with it.

**Background:** the campaign tab shows the `background` picture of the campaign you are in behind its sidebar and pages, under a wash of the page colour. A subtle wash lets the least of the picture through and a strong one the most. Text never sits on the picture: the sidebar, the bottom bar and each page's content are on solid panels of the page colour, so every text and marker keeps at least 4.5:1 contrast whatever the picture, and the picture shows only around and between them. On a phone or a narrow tab little of it shows. Changing the `background` or `wash` of the main note, or moving to another campaign, changes the picture at once. A `background` that links anything but a picture (avif, bmp, gif, jpeg, jpg, png, svg or webp), or a picture no longer in the vault or outside the Campaigns folder, shows nothing. A note moved into a campaign's folder while it is open in Obsidian's editor shows the picture behind its text there, under the same wash, until it is opened again. Notes outside every campaign, and the plugin's dialogs, keep the plain background.

**Campaign settings:** the plugin's page in Obsidian's settings starts with the *Campaigns folder*, the folder chosen or, while there is none, that the plugin reads and writes nothing until one is chosen, and *Choose folder*, which lists every folder of the vault by path to pick from. Below it, it shows the campaign you are in, by name: its folder, its background picture and how much of the picture shows. The campaign you are in is the one whose note you opened last, or the one chosen on that page. The plugin keeps it in its own `data.json`, follows the folder when it is renamed, and starts in it next time unless a note of another campaign is open. The same page has *Show this again* under *Welcome page*, which opens the welcome page in the campaign tab, behind the settings window. Choosing a picture from the Campaigns folder writes `background: "[[<picture>]]"` to the main note, **Remove picture** deletes the `background` property, and choosing how much shows writes `wash`. These writes go through Obsidian's own property editing, which writes the whole properties block again: comments in it can be lost, quoting can change, and a main note without properties gets a properties block at its top. The text below the properties is left as it is.

**The campaign tab:** the plugin shows the campaign you are in as one tab, laid out like the prototype: the campaign's name and a sidebar of pages, *Dashboard*, *Characters* and *Session notes*, then, under *From the notes*, *Questions*, *Quests* and *Party funds*. Pressing a page in the sidebar shows it in the same tab. Questions and Quests show how many are open beside their names. Each ribbon icon and its command (*Open dashboard*, *Open characters*, *Open questions*, *Open quests*, *Open party funds*) opens the tab on that page, or moves the tab that is already open to it, and Obsidian opens the tab on the same page next time. Older versions showed Questions, Quests and Party funds as sidebar panels, and the dashboard and each character sheet as their own tabs; those tabs are closed when the plugin loads, or, for a sheet, opened in the campaign tab on that sheet.

When the tab is narrow (its page area 1023 pixels wide or less: a phone, a tablet held upright, or a narrow tab or split on a computer), the sidebar becomes a bar along the bottom of the tab with *Home*, *Cast*, *Notes* and *Funds*, each a symbol above its short name, the current page marked. Questions and Quests aren't in the bar: the dashboard's *All questions* and *All quests* open them. On a phone the bar sits above Obsidian's own navigation bar, and on a phone or tablet it keeps clear of the home bar and, held sideways, of the notch and rounded corners at its sides. The page scrolls above the bar.

Opening one of these files, in any way Obsidian opens a file (the file list, a link, the quick switcher, search, back and forward, a new tab or split, or the workspace Obsidian restores when it starts), shows the campaign tab in place of the editor or Bases:

| File | Shows |
|---|---|
| The campaign's main note, `<Campaigns folder>/<Name>/<Name>.md` | The Dashboard |
| A note in the campaign's `Characters` folder | The Characters page, on that character's [sheet](#character-sheet) |
| `<Campaigns folder>/<Name>/Characters.base` | The Characters page |
| A session note, `<Campaigns folder>/<Name>/Sessions/Session <number>.md` | The [Session notes](#session-notes-page) page, on that session |
| A note in the campaign's `Items` folder, or a folder inside it | The Party funds page, with that [item open](#items) |
| Any other Markdown note in the campaign's folder, wherever it is, such as `Old Mill.md` or `Places/Gilded Stag.md` | Its own [note page](#note-page) |

Opening a file of another campaign moves you into that campaign. No Markdown note of a campaign opens in Obsidian's editor any more. A campaign's other files (pictures, PDFs, canvases, and bases other than `Characters.base`) and every file outside a campaign or outside the Campaigns folder still open as Obsidian opens them. There is no way back to the plain note for these files: to change a character's note by hand, edit it with the plugin off, or use *Edit character* and the sheet; to change or remove a line of a session, use *Edit all* on the Session notes page; an item's note and any other note are changed on the note page. Tabs that already show one of these files when the plugin is turned on are switched to the campaign tab. The tab keeps the page and the note it shows, so Obsidian's back and forward buttons step between pages and sheets, and it opens there again next time. When that note is renamed, the tab follows it; when it is deleted, the tab goes back to the page without it, such as the character gallery, but the Session notes page and the note page stay on it, keeping what was typed.

Opening a campaign file while the campaign tab is already open in the same window shows it in that tab instead of opening another: the tab it was opened in goes back to what it showed before, or closes if it showed nothing. A pinned campaign tab is left as it is. Back and forward in a tab step through its own history and never move it.

Turning the plugin off leaves its campaign tabs as Obsidian's placeholder for a view it can't show, until you turn the plugin on again; the files themselves open in the editor and Bases as usual while it is off.

**Note page:** a note of the campaign that no other page shows, such as a place, opens on a page of its own in the campaign tab. It isn't in the sidebar or the bottom bar, and no page there is marked while it shows, as it is reached by opening the note. It shows the note's name as its heading and the note's whole text, properties and all, in the same plain text box as the Session notes page; this is the one place such a note is changed while the plugin is on.

- *Save*, or Ctrl + Enter (Cmd + Enter on a Mac), writes the box's text as the note's whole text, in one change of the note. It can't be pressed until the text differs from the note, and the box is read-only while it saves.
- Before it writes, it reads the note again, in the same step as the write: if the note was changed anywhere else since the page loaded it (another device, a sync, another app), it writes nothing, keeps what you typed in the box and says so. *Load the note again* then shows the note as it is now; it drops what you typed, so it takes a second press. Copy out what you typed first.
- While nothing is typed, the box follows changes made to the note elsewhere.
- What is typed but not saved stays in the box while you move between pages of the tab and when Obsidian closes and opens again, with the note's text it was typed over, so a change made since is still caught. It is kept on this device only, with the Session notes page's unsaved lines, by note, following a rename, until it is saved or typed back to what the note says. Two boxes open on the same note show the same text: what is typed in one shows in the other.
- When the note is deleted, the page stays on it, keeps the box and what you typed, says the note is gone, and saves nothing.
- Below the box, *Links in this note* lists each `[[link]]` in the box once; pressing one opens that note, in the campaign tab when it belongs to the campaign.
- A note saved with Windows line endings, or with a byte order mark at its start, keeps them when it is saved; the box shows its lines as usual.
- A new note made inside the campaign's folder, with Ctrl + N (Cmd + N on a Mac) or by pressing a link to a note that doesn't exist yet, opens on its note page too.
- The page doesn't rename a note: rename it from Obsidian's file list, and the page follows it. When a note is moved out of the campaign while its page shows, the page says so and offers *Open in Obsidian's editor*, which opens it there in the same tab; it can't be pressed while what you typed is unsaved, so save first. A note moved out of the [Campaigns folder](#the-campaigns-folder) altogether can't be saved or opened from the page: copy out what you typed, and open the note from Obsidian's file list.
- Obsidian's templates are inserted in its editor, so they can't be inserted into a campaign note while the plugin is on; paste the template's text into the box instead.

The page never deletes a note.

<a id="welcome-page"></a>**Welcome page:** the first time the plugin is turned on in a vault, the campaign tab opens by itself on a *Welcome* page. Like the note page, it isn't in the sidebar or the bottom bar. It shows three short first steps: that the campaign lives in this tab and the sidebar (or, on a phone, the bottom bar) moves around it; that *New session* starts a session, where a line starting with `?` is a question, `!` a quest and `$` coin or an item; and that opening any note of the campaign comes back to the tab. Below them is one button: *Start my first session* while the campaign has no session notes, or *Go to my campaign*, which shows the Dashboard, once it has. While no [Campaigns folder](#the-campaigns-folder) is chosen, the button gives way to what it is for and *Choose a folder*, which lists every folder of the vault to pick from, with a box and *Make the folder*, which makes the folder typed (such as `D&D` or `Games/D&D`, refused as the vault itself, a hidden folder, with `..` or with a part a file can't be named) or uses it if it is there already, and chooses it. Once it is chosen and holds no campaign yet, the page shows what a campaign is (a folder inside the Campaigns folder holding a note of the same name) and *Make a campaign* with a box for its name, which makes `<Campaigns folder>/<Name>/<Name>.md` and moves you into it; a name a note's file can't have, or one already used by a folder or file in the Campaigns folder, even with other capitals, other invisible characters or another kind of space, is refused and nothing is made. Names elsewhere in the vault don't matter. The name is taken as Obsidian writes a path, so a non-breaking space in it becomes a plain one. If the main note can't be made, the new folder is removed again, as long as it is still empty, and the message says why the note failed and names the folder if it couldn't be removed. If the campaign is made but moving into it fails, the message says so; open its main note to move in. Before it opens the page, the plugin writes `welcomeSeen: true` and `lastVersionSeen` (this version) to its `data.json`, so the page shows by itself only once per vault, and not at all if `data.json` can't be written; *Show this again* in the plugin's settings opens it any time. The one exception is the Campaigns folder: while none is chosen, on a new install or after an update alike, the campaign tab opens on the welcome page at every start, and every page of the tab, from the sidebar or a command, shows the welcome page asking for it instead. The plugin doesn't know whether it was installed before. It takes a vault for an update when its `data.json` already has `welcomeSeen`, or when a campaign in the Campaigns folder already has a session note the first time this version runs; the second gets `welcomeSeen` only, no welcome page, and the update's news, below. An update from 0.2.0 or earlier has neither: those versions never wrote `welcomeSeen`, and with no Campaigns folder chosen yet no campaign can be found. So it is taken for a new install: the welcome page opens, asking for the Campaigns folder, and `lastVersionSeen` is set to this version, so any news this version lists doesn't show.

<a id="whats-new"></a>**What's new:** after an update whose version lists something new, the Dashboard shows one line above its panels: *New:* and one sentence, then *Show me*, which opens the page it is about, and *Dismiss*. Either one hides the line and writes the version to `lastVersionSeen` in `data.json`, so each update's line shows until it is pressed and never again. What a version lists is written by hand in the plugin's code, one sentence per version at most, so nothing is announced by accident; most versions list nothing, and show no line. A fresh install counts its own version as seen, since the welcome page covers it.

**Dashboard:** the campaign tab's first page shows where the campaign stands. It writes nothing and keeps nothing: each panel counts from the same lines as its full page, so the numbers match, and redraws as you write. Each panel opens its full page:

| Panel | What it shows | Opens |
|---|---|---|
| Open questions | How many, and the three newest | *All questions*: the Questions page |
| Active quests | How many, and the three newest | *All quests*: the Quests page |
| Purse | The purse, how many items are held, money in and out, and the three latest entries | *Party funds*: the Party funds page |
| Characters | Each note in the campaign's `Characters` folder with its class, AC and HP, the player's own first and marked *Your character*, then the rest by name | *All characters*: the Characters page |
| The latest session | Its heading, such as *Session 13 · The ferry at dusk*, how many questions, quests and coin entries were written in it, and the four written last | *Write notes*: the session's Notes page. *New session* starts the next one |

Tapping a question, quest or coin entry opens its dialog, as on its own page, and tapping a character opens their sheet. When two session notes share the highest number, it isn't clear which is the latest, so the last panel shows no session and says to rename one, as the dialogs that write into the latest session do.

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

**New session:** creates `Sessions/Session <highest + 1>.md` with `played` (the date chosen, today by default) and, if one is given, `title`. Nothing else is copied into it. The campaign tab then shows its [Notes page](#session-notes-page), ready to write in.

### Session notes page

The campaign tab's *Session notes* page is where a session is written. It shows the session asked for (opening a session note, choosing one, or *Write notes* on the dashboard), or else the latest one, and then stays on that session even when a newer one arrives; when two sessions share the highest number it shows none and says to rename one, as the dashboard does.

- **The header** shows the session, such as *Session 12 · The Old Mill*, a list of the campaign's sessions to switch between, newest first, each with its title and the date it was played (*Session 12 · The Old Mill · 9 Nov 2026*, leaving out what is blank), and *New session*.
- **The box** is a plain text box: no colours while typing. Each line is typed as it would be in the note (`? Who sent the letter`, `! Find the caravan, from: [[Lady Vess]], reward: 200 gp`). *Save*, or Ctrl + Enter (Cmd + Enter on a Mac), adds every line that isn't blank or a lookup, trimmed, to the **end** of the session note, after a line break, in one change of the note. Nothing already in the note is moved, changed or removed, and its properties stay as they are. Lookup lines stay in the box; the rest is cleared. *Save* can't be pressed while there is nothing to save. While a save runs, every box for that session is read-only, so nothing typed is lost and nothing is written twice. If the note can't be written (the lines would turn into its properties, or the note is gone), nothing is written, the lines stay in the box and the page says why. Every box open for the same session shows the same text: what is typed in one shows in the others. When the session's note is deleted, the page stays on that session, locks its box and says the note is gone; it never moves to another session on its own. What was typed in the box and not saved is kept under *Kept from deleted sessions* on the Session notes page, with the session's name and when it was deleted, so a new session made with the same name starts with an empty box. Lines typed for a session whose note is no longer there when Obsidian opens (removed while it was closed; this is checked only once a Campaigns folder is chosen, so an update that has none yet sets nothing aside), or left under a path another session is renamed onto, are set aside the same way under *Kept from missing sessions*. *Copy into this session's box* adds those lines after what the box of the session shown already holds; *Discard* drops them on a second press. What is typed but not saved stays in the box while you move between pages of the tab and when Obsidian closes and opens again: it is kept **on this device only**, in Obsidian's storage for this vault, not in the vault or the plugin's settings file, so it doesn't sync to other devices. It is kept by session note, following a rename, until it is saved or emptied, written half a second after typing stops and again when Obsidian quits, the plugin is turned off, or the app is put in the background or its page hidden (as on a phone). If the device doesn't keep it, a notice says so. Lines that an earlier version kept in the plugin's settings file are moved to each device once, never into a box: they are listed under *Kept from an earlier version*, with the session's name and when they were moved, to copy or discard on that device. They are taken out of that file only after the device has kept them.
- **Lookups:** typing `??`, `!!` or `$$` and a few words on a line of the box suggests the open questions, active quests or held items that hold every word, as in a note (see [Following up](#following-up-an-earlier-line)): ↑ and ↓ move, Enter or a click picks, Esc closes. Picking removes the lookup line from the box and opens the dialog, which writes its follow-up line into the session shown. Lookups are suggested only in this box, never in Obsidian's own editor.
- **Notes** lists the lines of the session note below its properties, newest first: the last line in the note, written last, is at the top. It shows how many there are. Each line shows its mark (`?`, `!`, `$`, or `?=`, `$$` and the like) in its colour, and its links as links that open the note linked. A question that is answered and a quest that is completed show ✓; a quest abandoned and an item sold, used up or lost show ✕ and are struck through. The list redraws whenever the note changes.
- **Edit all**, beside the *Notes* heading, is for fixing what is already written, such as a typo in an old line. It shows the session note's whole text, properties and all, in a box in place of the box for adding lines and the list, which are hidden until you leave. It saves exactly as a [note page](#note-page) does: *Save* or Ctrl + Enter writes the box's text as the note's whole text in one change, and only if the note hasn't changed anywhere since the box loaded it (otherwise it writes nothing, keeps what you typed and says so, and *Load the note again* takes a second press); Windows line endings and a byte order mark are kept; what is typed but not saved is kept on this device, with the note's text it was typed over; and when the note is deleted, it says so and keeps what you typed. *Done* goes back to adding lines. With changes not saved, *Done* says so instead of leaving, and offers *Keep editing*, or *Back to adding lines*, which leaves them kept on this device: *Edit all* then reads *Edit all (not saved)*, a note above the box for adding lines says an *Edit all* change isn't saved yet, and pressing *Edit all* shows them again. Moving to another session or page keeps them the same way. Lines added to the session before those changes are saved change the note, so *Edit all* then writes nothing and says the note has changed: copy the change out, load the note again and make it again.

- **Clear notes** and **Delete session**, beside *Edit all*, both remove what was written, so each asks first in a dialog, where *Esc*, a click outside or the keep button (which has the focus) changes nothing. Neither can be pressed while a save of this session runs, and *Clear notes* can't be pressed while the session has no lines. Only one of these dialogs is open at a time. If a save starts while the dialog is open, nothing is done and the page says so. While clearing or deleting runs, the box for adding lines can't be saved.
  - *Clear notes* asks *Clear the notes of Session 12 · The Old Mill?*, saying how many notes go (*Its 4 notes go, including any questions, quests and ledger lines first written in them. The session and its properties stay.*), with *Clear notes* and *Keep notes*. Clearing empties the note below its properties in one change of the note; the properties stay exactly as written, and so does the note, if it changed in any way since the dialog opened, or if it starts with `---` but its properties block can't be read, as when it isn't closed (the page says which). The page stays on the session.
  - *Delete session* asks *Delete Session 12 · The Old Mill?*: *Its 4 notes go with it, including any questions, quests and ledger lines first written in it. Other sessions, and values learned on character sheets, stay.* (*Its 1 note goes with it…* for one, *It has no notes.* for none), with *Delete session* and *Keep session*. Deleting moves the note to the trash Obsidian is set to use (Settings → Files and links → Deleted files), so it can be taken back from there, unless Obsidian is set to delete permanently: then the dialog says the note can't be taken back. Nothing is deleted, and the page says so, if the note changed in any way since the dialog opened or another note has taken its place. Lines typed in its box and not saved are kept under *Kept from deleted sessions*, as for any deleted session. The page then shows the latest session left, or says there are none.

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

*Add coin* on the Party funds page writes money in as `$ <amount> <what for>` and money out as `$ Paid <amount> <what for>`, into the session you're in. It shows how the line will be read as you type, and saves only if it reads back as exactly the money chosen. It refuses an amount with stray commas, a sign or money word that says the other way, an amount that comes to nothing, and `for:`, which marks a quest's reward collected. Tapping a `$` entry in the ledger opens it the same way: saving rewrites its line where it stands in its own note, keeping its bullet, and *Delete entry* removes it, each only if the line still says what was read, on the line it was read from, and the purse moves by exactly the difference. Saving with nothing changed writes nothing. The dialog only saves an entry it would write back word for word, as *Add coin* words it; any other, such as `$ Bought rope for 2 gp` or `$ +50 gp reward, -5 gp ferry`, can only be deleted there, so change it in its note, which *Open note* opens. A sale's entry belongs to its item's `$$` line, so while that sale is how the item went, tapping it opens the item instead, where its price can be corrected. Once a later line names the item again, tapping the sale opens its note.

## Following up an earlier line

Answers, progress and changes are new lines, written in the session where they happen. Each one starts with the earlier line's text and a colon, then says what happened:

```markdown
? Who sent the letter                           (Session 12)
?= Who sent the letter: [[Lady Vess]] sent it   (Session 13)
```

You don't type the earlier line's text. Type `?? letter` or `!! caravan` on its own line in the box on the [Session notes](#session-notes-page) page (lookups work only there, not in Obsidian's editor), and the plugin suggests the open questions or active quests holding every word typed, newest first, at most eight, with the words marked. Words are matched as the text reads, so a link matches by what it shows. Pick the line from the suggestions: the lookup line is removed and the question's or quest's dialog opens, as if you had tapped it on its page. Then choose what happened. The plugin then writes the follow-up line into the session you're in: the session the Session notes page shows, or else the campaign's latest. An open session earlier than the question, or than any of its clues or its answer, is passed over, since a follow-up is only read after the line it follows and a clue only while its question is open. You may also type one in full.

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

A question is open until it has a `?=` line. Reopening it removes that `?=` line; changing the answer replaces it with a new one in the same note, so later questions keep their clues; a follow-up typed with it still goes into the session you're in, and is refused if a question already reads like it. Before writing an answer, a reopening or a follow-up, the plugin reads the notes as they would be after the change, and writes nothing unless only this question changes as intended. A delete has no such check: it removes only the question's own lines, where they were read. Deleting a question removes its `?` line, its clues and its answer, wherever they were written. The plugin does each only when you ask. It removes a line only if it still says what was read, on the line it was read from; another line that reads the same is never taken in its place. If the question or the answer being replaced has changed or moved since it was read, it writes nothing and says so; deleting a question leaves any clue or answer line that was changed or moved since it was read, and says which notes kept them. Another line that reads like the question is never deleted with it. An answer that would be read as another open question's, because that question starts the same way, is refused. An answer can't be given from the page while an earlier open question reads the same, since the answer would go to that one.

*New question* on the Questions page adds `? …`, and `?= …` if an answer is given, to the campaign's latest session, so the new lines are read after every other. It refuses a question that reads the same as one already asked, open or answered, since their answers would be mixed up, and an answer that would be read as another question's.

### Quests

| Line | Means |
|---|---|
| `!+ Find the missing caravan: tracks lead to [[Old Mill]]` | Progress. The quest stays active |
| `!= Find the missing caravan: found it under the Old Mill` | Completed, with what happened |
| `!x Find the missing caravan: the wagons burned` | Failed or abandoned, with what happened |
| `! Escort [[Mira]] to the ferry, after: Find the missing caravan` | A follow-up quest |
| `$ +200 gp reward, for: Find the missing caravan` | The reward collected. It is coin in, and the quest counts as paid |

Tapping a quest on the Quests page opens it to note progress, complete or abandon it with what happened, collect a coin reward, or open a follow-up quest. Each writes the line above into the session you're in, as answers are. Setting a finished quest active again removes its outcome line, and changing the outcome replaces it. A coin reward of one amount is offered until a `$ … for: <quest>` line for it exists, so it can't be collected twice, and not at all when the quest's own title holds an amount the reward line would also count. Quests sharing a title share that check, and a reward already written by hand in other words isn't recognised, so switch the toggle off for it. A changed outcome is written in the old outcome's note, so a later quest of the same title keeps its lines. Deleting a quest removes it with its progress and outcome lines. The same refusals hold as for questions: a line changed since the dialog opened, an earlier active quest with the same title, or a note that would read as about another quest. Before writing, the plugin reads the notes as they would be after the change, and writes nothing unless only this quest changes as intended and the purse moves by exactly the reward. Deleting a quest leaves its reward line and its follow-up quests.

*New quest* on the Quests page adds `! <quest>, from: <giver>, reward: <reward>` to the campaign's latest session, so it is read after every other line. *Given by* suggests the campaign's characters; one with a note is linked, by its full path if another note shares its name. It refuses a title already used, and a quest that would read back differently from what was typed, such as one with `from:` or `reward:` in a field.

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

Opening an item's note, a note in the campaign's `Items` folder named after the item, shows the Party funds page with that item open: a panel above the purse with the item's name, who holds it (or, for a gone item, who last held it), whether it is held, sold, used up or lost, and the story written in its note below its properties, with its links. Its row is marked in the lists, and the gone items unfold when it is gone. *Change holder or status* opens the item's dialog, below. *Edit its note* shows the note on its [note page](#note-page), and *All items* closes the panel. When no session line names the item yet, the panel says so, shows its note all the same, and suggests a `$$` line that gives it to the party. The panel follows changes to the sessions and to its note.

Tapping an item on the Party funds page opens it: who holds it, and whether it is held, sold, used up or lost, with a price for a sale. A new holder or status is written as one of the `$$` lines above, naming the item as it was written, link and all, into the session you're in, passing over an open session earlier than the item's last line. A holder is written the way it was last written: one written in plain text, as in `:changed to Old Tom`, stays plain text, so no link to a missing note appears, and a linked one stays a link. A holder with a note in the campaign's `Characters` folder is offered as a link to it. Setting a gone item held again removes the line that took it, with its sale; an item named only by that line gets a `:changed to` line instead, so it stays. Changing how an item went replaces that line. *Sold for* shows a sold item's price as its line writes it, or nothing when the dialog couldn't write that line, such as `:sold -5 gp`. Correcting the price rewrites the `:sold` line where it stands, keeping its bullet and the words before ` :sold`; leaving the price as it was, or writing the same amount another way, writes nothing. Each is done only when that line says no more than the dialog writes, like `$$ Lantern :sold 30 gp`, and still reads as it did, on the line it was read from; for one with more words, change it in its note, which the dialog then offers to open. The dialog works from the notes as they were when it opened. Before it writes, it reads the session notes again: if they changed while the dialog was open in a way that changes how the item reads, even by one of its lines moving, it writes nothing and says so. Saving with nothing changed still writes nothing. A gone item can't be given to someone else while it stays gone, since the new holder's line would bring it back. Before writing, the plugin reads the notes as they would be after the change, and writes nothing unless every item comes out as asked and the purse moves by exactly the sale, or by the difference a corrected price makes.

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
| Not known yet | No line states it, or the newest line in the sessions says `?` (`[[Mira]] HP: ?`) | Greyed out, with `?` |
| Override | On the character's own note, at the start of a line (`AC: 16`) | Marked so it never passes for something you saw |
| Carried over | On a character note in another campaign, named by the character's `carried from` property (see [Calling a character over](#calling-a-character-over)) | Marked with that campaign's name. Anything learned in this campaign wins over it |
| Changed over time | More than one line states it | The newest value, with the earlier ones and their sessions on tap. A list value (languages, say) adds them up instead |

"Newest" means the highest session number, and then the lowest line in that note. So a value marked not known shows again as soon as a later line states it. A `?` on the character's own note is read like any other override.

A name is letters and spaces, read whatever its capitals (`ac:` is `AC`). A value runs to the next comma that a name and a colon follow, so the comma in `type: Medium humanoid (human), lawful good` stays in the type, and a name with nothing after its colon states nothing. Learned values and overrides are read today, each with the note and line it came from, with an override winning over anything learned and the newest line winning among the rest. A session's properties are never read as facts, and a link counts for the note Obsidian resolves it to, so `[[Mira]]` and `[[Characters/Mira|her]]` state facts about the same character. Carried-over values and earlier values are read too. Other names are read whatever their capitals, so `Languages:` and `languages:` are one value, shown as first written. List values that add up aren't read yet: a list shows its newest line, with the others as earlier values.

On the character's own note, every line that starts with a name and a colon is a value, prose included, so `Personality: grumpy, but kind` shows on the sheet as *Personality*, marked as an override. That keeps the note to one format, and the sheet shows every such line, so none is taken for something seen at the table. To keep a line of prose off the sheet, start it some other way, such as in a quote (`> Personality: grumpy`), or without the colon (`Personality — grumpy`). Since such a line may be prose, the sheet asks for a second press before any change that would remove it (see [Character sheet](#character-sheet)).

### Making, renaming and deleting a character

*New character*, at the top of the Characters page, opens a dialog with the character's name, type line, subtitle and speed. It makes a note named after them in the open campaign's `Characters` folder, making the folder if it isn't there, and opens it. Each value given is written on the note as an override, one per line, and every other value starts as not known:

```markdown
type: Medium humanoid (human), lawful good
subtitle: Human Cleric 5
speed: 30 ft.
```

*Edit character* opens the same dialog filled in from the note's own lines, with a *Delete character* button. It is the *Edit character* button at the top of the character's [sheet](#character-sheet), the *Edit character* command in the command palette while their sheet is shown, and *Edit character* in the note's menu when you right-click it in the file list, or long-press it on a phone. Under each value the sessions have taught, the dialog shows it (*Learned in the sessions: 30 ft.*), so you can see what a value of your own would cover up.

- **Renaming** goes through Obsidian's file manager. With Obsidian's *Automatically update internal links* setting on (Settings → Files and links), it rewrites every `[[link]]` to the note, in session notes and everywhere else; with it off, links keep the old name. The note stays in its folder, and its path is written the way Obsidian keeps paths (`normalizePath`).
- **A changed value** rewrites the last line that states it, when that line states nothing else, keeping its bullet. When the last line that states it has other values on it, as in `AC: 15, speed: 30 ft.`, the new value is added as a line at the end of the note, which wins.
- **A cleared value** removes every line that states it on its own, so an older line can't bring it back. If a line with other values still states it, nothing is written and the dialog says so.
- **Lines it never writes to:** hidden lines are skipped, and a new line is added at the end instead. A line is hidden inside a fenced code block (a fence closes only at a bare fence of the same kind, at least as long), an indented code block (four spaces or a tab, at the start of the note's text or after a blank line or a code block), a `%% %%` or `<!-- -->` comment, or a `$$` math block, counted from below the note's properties. Marks inside `inline code` don't count. A line that ends in a block id (`speed: 30 ft. ^stats`) is left, since links may point to it: changing or clearing a value on such a line is refused.
- **A last check:** the changed note is read again before it is written. If it wouldn't give back exactly the values asked for, or if any line it wrote would be hidden, or any line it kept would become hidden or stop being hidden (as when a new line lands in a comment or code block that never closes), nothing is written. A value nobody changed is never written.
- **Deleting** needs a second press within four seconds. The note goes where Obsidian's *Deleted files* setting sends it (Settings → Files and links): the system trash, the vault's `.trash` folder, or nowhere, if it is set to *Permanently delete*. Every other note is left alone, so the session lines about the character stay, linking to a note that's gone.

The name and values are trimmed, then the dialog refuses, and writes nothing, when it's given:

| Refused | Why |
|---|---|
| A name another note in the folder has, whatever its capitals, compared after `normalizePath`, with invisible characters left out, every kind of space read as a plain space and letters composed the same way, so names that differ only by invisible characters or the kind of space count as the same name | Two notes can't share a name, and links would point at either |
| A name with any of `\ / : * ? " < > \| # ^ [ ]` or a control character (including the C1 controls) or a line or paragraph separator, or starting or ending with a dot or a space | A note can't be named that everywhere, or a link to it wouldn't work |
| Any invisible character, such as a zero-width space, a byte order mark, a text direction override or a Hangul filler, except: joiners only inside emoji (between two emoji, after a skin tone or presentation selector that follows one), the presentation selector only right after an emoji, and tag characters only in the flags of England, Scotland and Wales. Also half of a character, as text pasted in broken can hold | Nothing would show where it is, so two names would look the same. Any other run of tag characters draws as the same black flag |
| `CON`, `PRN`, `AUX`, `NUL`, `CONIN$`, `CONOUT$`, `COM0` to `COM9`, `COM¹` to `COM³`, `LPT0` to `LPT9` or `LPT¹` to `LPT³`, whatever the capitals, also with more after a dot | Windows keeps these names, so a vault synced there couldn't hold the note |
| A name whose file name would be over 255 bytes | Most file systems can't hold it |
| A value with a comma, a word and a colon in it, as in `Rogue 3, AC: 15` | It would read back as two values |
| A value with `%%` in it, or ending in a block id, as in `40 ft. ^stats` | The `%%` would start a comment hiding the rest of the note, and the block id would become the line's |
| A new name for a note that was moved or renamed since the dialog opened | The dialog would rename it from a place it no longer is. The dialog closes, since what it shows is out of date |
| A value changed in the note since the dialog opened | So nothing written meanwhile is lost. The dialog closes, since what it shows is out of date |
| A change that would turn the note's first lines into properties | So nothing is hidden |

A dialog with no name does nothing.

Fact lines are still read inside hidden lines today, so a value there shows on the card and the sheet, and neither the dialog nor the sheet can change it.

### Character sheet

A character's sheet is a page of the campaign tab, on the Characters page, with *← All characters* above it to go back to the gallery. Tapping a character's card on the Characters page, or a character on the dashboard, shows their sheet in the same tab, and opening the character's note in any other way shows it too (see [The campaign tab](#campaign)). Tapping a card in a gallery of another `.base` file opens the character's note, which shows the sheet. Obsidian's back button goes back to where it was opened from. The sheet follows the note when it is renamed, and Obsidian opens it again next time with the rest of the workspace. It writes nothing until you change a value. It redraws when the character's note, a note in their campaign, or the note they were carried from or a note in its campaign changes, is deleted or is renamed. If the notes can't be read, it says so in place of the values.

It shows the character's name, their subtitle when known, the six ability scores with their modifiers, then the type line, subtitle, class, Armor Class, Hit Points, speed and alignment, and every other value after them. Each value is drawn in its state's colour and says where it came from:

| State | Under the value |
|---|---|
| Learned | The session it was learned in, which opens the line |
| Override | *Override*, which opens the line on the character's note |
| Carried over | *Carried from* and the campaign, which opens the line on the note it was carried from |
| Not known yet | *Not known yet*, which opens the `?` line when there is one |

A value with earlier lines shows how many (↺ 2). *Edit character*, at the top, opens the character dialog.

Under the values is the character's stat block, built from the values the sheet shows: their name, the type line and subtitle when known, then class, Armor Class, Hit Points and speed, and the six ability scores with their modifiers. It is the stat block the Characters page's cards show, in the same colours, and it shows carried-over values too. A value not known shows as a greyed `?`, never blank, whether no line states it or the newest line says `?`. The stat block only shows the values; they are changed by tapping them above it.

Tapping a value opens a dialog with the value, its earlier values newest first, each with its session (tapping one opens its line), and a button for each state. The button you tap saves the value typed in that state:

- **Learned at the table** adds `[[Mira]] AC: 16` at the end of the campaign's latest session, and clears the character's override, which would otherwise cover it. If the newest learned value is already the one typed, only the override is cleared.
- **Override** writes `AC: 16` on the character's own note, as the character dialog does: it rewrites the last line that states it on its own, or adds a line at the end.
- **Carried over** clears the override, so the value carried from another campaign shows again.
- **Not known yet** adds `[[Mira]] AC: ?` at the end of the campaign's latest session when a learned or carried value would otherwise show, and clears the override, as *Learned at the table* does. Like any learned line, it is newest only until a later session states the value again.

Enter saves the value in its own state, or as learned when it wasn't known. Lines on the character's note are written and removed by the rules in [Making, renaming and deleting a character](#making-renaming-and-deleting-a-character), with the same last check.

Clearing an override removes every line on the character's note that states the value on its own. For the sheet's own names (`type`, `subtitle`, `speed`, the six scores, `class`, `AC`, `HP` and `alignment`) that happens on the first press. For any other name the line may be prose, so *Learned at the table*, *Carried over* and *Not known yet* need a second press within four seconds, as deleting does, and the dialog says why. *Override* rewrites the line with the value typed and needs only one press.

The sheet refuses, and writes nothing, when:

| Refused | Why |
|---|---|
| The value changed in the notes since its dialog opened | So nothing written meanwhile is lost. The dialog closes, since what it shows is out of date |
| Learned or Override with no value typed, or with `?` | `?` means not known; there's a button for that |
| A value with a comma, a word and a colon in it, with `%%`, or ending in a block id | As in the character dialog |
| Carried over when no carried note gives the value | There's nothing to carry |
| Carried over when the value was learned in this campaign | What was learned here wins over a carried value |
| Carried over when a `?` line in this campaign marks the value not known | That line wins over the carried value until a later line states it. The dialog says so before Not known yet is chosen over a carried value |
| Carried over with a value other than the carried one | That value belongs to the other campaign's note. Change it there, or choose Override |
| Learned at the table or Not known yet with no session, or two session notes sharing the latest number | It isn't clear where the line goes |
| Learned at the table or Not known yet when the link wouldn't point to this character from the session | The line would be about someone else |
| Learned at the table or Not known yet when the new line would land in a code block or comment that never closes | It would be hidden |
| A change on the character's note that the character dialog would refuse | As in the character dialog. Then the session line isn't written either |

The session line is written first and the character's note after it. If the note can't be changed by then, the sheet says the line was added but the note was left, so you can fix one of them by hand.

#### In the notes

After the stat block, *In the notes* lists every session line, in every campaign, with a link to the character, and says how many there are (*3 lines*). Lines in other notes, such as a place's note or another character's, aren't listed. It is built from Obsidian's own link index, so a link counts for the note Obsidian resolves it to, as for fact lines: `[[Mira]]`, `[[Characters/Mira|her]]`, `[[Mira#Stats]]` and an embed, `![[Mira]]`, all count. A line with two links to them shows once. Links in a session's properties aren't lines, so they don't show. Obsidian doesn't index links in code blocks or comments, so lines there don't show either.

Each line shows as written, without its bullet, with its session under it (*Session 12*), and the campaign too when it isn't the character's own (*Session 2 · Ashen Road*). Tapping it opens the session at that line; tapping a link in it opens the link. The character's own campaign comes first, then the other campaigns by name, each campaign's lines together. Within a campaign the newest session comes first, and in each session the last line first, since it was written last. With no line yet it says *No session mentions [[Mira]] yet.* If the sessions can't be read, it says so.

A renamed character keeps their lines when Obsidian's *Automatically update internal links* setting is on, since every link is rewritten to the new name. With it off, the old links point nowhere, and their lines leave the list until the links are fixed.

The lines are read when the sheet opens, and read again when Obsidian has resolved the links of a session that's on the list or now links to the character, and when a session on the list is deleted or renamed, once changes have settled for a moment. When the rest of the sheet redraws, the list is drawn again from the lines already read. A changed note is checked by its own links only, so writing elsewhere in a big vault costs a look at that note's links and no more.

### Calling a character over

Calling a character into another campaign is a choice, made in a dialog: everything, only the groups you pick (ability scores, other values, history), or only a link. The new campaign's note for them records it in two properties:

```markdown
---
carried from: "[[Ashen Road/Characters/Mira]]"
carried: [abilities, values]
---
```

Only the groups listed in `carried` show on the sheet as carried over: `abilities` for the six scores and `values` for everything else. The sheet reads the carried note's values as its own sheet would, from its campaign's sessions and its own overrides. Until the dialog is built, the two properties can be written by hand. `history` isn't read yet. The same dialog works as a library: it can call over anyone from any other campaign, or from the game system's own notes, which are there before the first campaign.

### Characters page

The campaign tab's *Characters* page shows a card for each Markdown note in the campaign's `Characters` folder, the player's own first and the rest by name, and redraws when one is added, changed, renamed or deleted, or when the campaign note changes. Opening the campaign's `Characters.base` shows this page too, and opening a character's note shows it on their sheet.

The same cards are also a view the plugin adds to Obsidian's Bases, named *Characters*, for a `.base` file that lists character notes, such as a `Characters.base` at the campaign's top. Bases does that file's filtering and sorting, and the plugin draws the cards, with the player's own character moved first and the rest in Bases' order. The plugin no longer writes `Characters.base`, and the one at a campaign's top now opens the Characters page instead of Bases; the view still works for any other `.base` file. Registering the view is why `minAppVersion` is 1.10.3.

Each card is a short stat block: the character's name, their `type` and `subtitle` when known, then `class`, `AC`, `HP` and `speed`, and the six ability scores with their modifiers. A value no line states, or marked not known with `?`, shows as a greyed `?`, and a type line or subtitle marked not known is left out. Carried-over values aren't on the cards yet; the sheet's stat block shows them. Each card reads the sessions of the campaign its note is in, even while another campaign is open, and a note outside any campaign shows only its own overrides. The player's own character, named by a link in the campaign note's `character` property, comes first and is marked *Your character*, and changing that property redraws the cards, on the dashboard too, so the new one moves to the top. Tapping a card opens the character's [sheet](#character-sheet). With no characters yet, the page says to add one with *New character*.
