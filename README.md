<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="logo/wordmark-dark.svg">
    <img alt="Dungeons & Dinthla" src="logo/wordmark-light.svg" width="420">
  </picture>
</h1>

An Obsidian plugin for tabletop campaign notes. You write what happens at the table, and the plugin keeps track of the open questions, quests and money, and fills in sheets for the people, places, factions and items you meet.

Each session's `?`, `!` and `$` lines also show in notes of their own, `Questions/Session 2.md`, `Quests/Session 2.md` and `Funds/Session 2.md`, linked back to the session (each is headed by its type and session, *Questions - Session 2*, on its page in the campaign tab), and an item named on three lines gets `Items/<item>.md`. The session lines stay the record, and the words you write below a note's properties are never touched (see [Kind notes](docs/note-format.md#kind-notes)). A person or place named on three lines, with a line saying which it is (`from:` on a quest, the holder of an item, or `@[[Old Mill]]` for a place), gets a note in `Characters` or `Places` unless a note for it already exists; a name no line places is asked about after each save that names it, *Character* or *Place* (see [People and places](docs/note-format.md#people-and-places)). In a campaign whose main note says `role: dm`, nothing is guessed: any link on three lines is asked about, *Character* or *Place*, and the answer makes the note (see [A DM's campaign](docs/note-format.md#a-dms-campaign)). A place's note shows *In the notes* too: every session line that links to it, as a character's sheet does.

It is built for players first, and for DMs and researchers on the same footing. It works on Obsidian mobile, since most notes are taken on a tablet at the table.

This README describes a project that grows in small steps: parts of it may still be planned, and whoever's change makes any of it untrue updates it in the same change.

## Install

The plugin isn't in Obsidian's built-in plugin list, so you install it from this repository's [releases](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/releases). It takes about five minutes.

### What you need

- **Obsidian 1.10.3 or newer**, on a computer, phone or tablet. To see your version, open *Settings → About* in Obsidian. Get Obsidian from [obsidian.md](https://obsidian.md/download).
- **The files from the latest release.** Open the [latest release](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/releases/latest) and scroll to *Assets*. There are four files:

| File | What it's for |
|---|---|
| `dungeons-and-dinthla-starter-vault-<version>.zip` | Trying the plugin with a sample campaign, without touching your own notes |
| `main.js`, `manifest.json`, `styles.css` | Adding the plugin to your own vault |

A *vault* is Obsidian's word for a folder of notes.

### Option 1: try it in the starter vault

1. Download `dungeons-and-dinthla-starter-vault-<version>.zip` from the latest release.
2. Unzip it. You get a folder called **Dungeons & Dinthla starter vault**. Move it somewhere you'll find it again, such as your Documents folder.
3. Open Obsidian.
   - If it shows its start screen, choose **Open folder as vault**.
   - If a vault is already open, click the vault's name at the bottom left, choose **Manage vaults…**, then **Open folder as vault**.
4. Pick the **Dungeons & Dinthla starter vault** folder and press **Open**.
5. Obsidian asks *Do you trust the author of this vault?* Choose **Trust author and enable plugins**.

The plugin's welcome page opens. The sample campaign, *Curse of the Pale Moon*, has three sessions, four characters and an item to look around.

**On a phone or tablet:**

- **Android:** unzip the file, open Obsidian, choose **Open folder as vault** and pick the unzipped folder. Then do step 5.
- **iPhone or iPad:** unzip the file in the Files app, then move the unzipped folder into the **Obsidian** folder (under *On My iPhone*, *On My iPad* or *iCloud Drive*). Open Obsidian, and the vault is in its list. Then do step 5.

### Option 2: add it to your own vault

#### On a computer

1. Download `main.js`, `manifest.json` and `styles.css` from the latest release.
2. In Obsidian, open your vault, then **Settings → Community plugins**.
3. If you see **Turn on community plugins**, press it. (Obsidian calls this leaving *Restricted mode*. It's off until you turn on your first plugin from outside its list.)
4. Next to **Installed plugins**, click the **folder icon**. This opens your vault's plugins folder.
5. In that folder, make a new folder named exactly `dungeons-and-dinthla`, and put the three files in it. It should look like this:
   ```
   plugins
   └── dungeons-and-dinthla
       ├── main.js
       ├── manifest.json
       └── styles.css
   ```
6. Back in Obsidian, click the **circular arrows** next to *Installed plugins* to reload the list.
7. Find **Dungeons & Dinthla** in the list and turn it on.

The plugin's welcome page opens and asks for your **Campaigns folder**: the one folder of your vault where your campaigns will live, such as `D&D`. The plugin only reads and writes inside that folder and does nothing until you choose it, so the rest of your notes stay out of its reach. Then make your first campaign on the same page.

If there's no folder icon, find the plugins folder yourself: it's at `<your vault>/.obsidian/plugins`. Folders whose names start with a dot are hidden. On Windows, tick **Hidden items** under **View** in File Explorer. On a Mac, press **Cmd + Shift + .** in Finder. On Linux, press **Ctrl + H** in most file managers. If there's no `plugins` folder inside `.obsidian`, make one.

#### On a phone or tablet

The easiest way is through a computer:

- **If your vault syncs** (Obsidian Sync, iCloud, Syncthing or Git): add the plugin on a computer as above and let the vault sync. Then, on the phone or tablet, open **Settings → Community plugins**, turn on community plugins if asked, and turn on **Dungeons & Dinthla**. With Obsidian Sync, also make sure *Installed community plugins* is ticked in its settings.
- **If it doesn't sync:** use a file manager on the device to make the `dungeons-and-dinthla` folder inside the vault's `.obsidian/plugins` folder and put the three files in it, as in step 5. Then do steps 2, 3, 6 and 7 in Obsidian.

### Campaigns and the Campaigns folder

Once the plugin is on, choose the **Campaigns folder**, on the welcome page or in the plugin's settings: the one folder of the vault where your campaigns live, such as `D&D`. The plugin reads and writes only inside it and does nothing until it is chosen, so the rest of your vault stays out of its reach. Every pull request and release scans the plugin's source for code that could go round that fence, working from allow-lists of what the plugin uses today and known patterns, and checks its released `main.js` and `styles.css` for known kinds of network code beyond the one D&D Beyond call described under *Network use*. Neither is a proof: they catch what they know to look for. [docs/note-format.md](docs/note-format.md#the-campaigns-folder) says what they check.

To make another campaign any time, press the small arrows beside the campaign's name at the top of the campaign tab and choose *New campaign* at the bottom of the list that opens, type its name and press *Make campaign*. The plugin makes its folder and main note inside the Campaigns folder and opens it; a name that is empty, already used or not allowed for a file is refused and nothing is made. [docs/note-format.md](docs/note-format.md#new-campaign) says more.

The plugin checks paths, so it can't see where a folder really is: a symbolic link (or, on Windows, a junction) inside the Campaigns folder that points elsewhere on your disk lets the plugin read and write there too. Keep such links out of the Campaigns folder.

### Check the files (optional)

You can check that the files you downloaded are exactly the ones published. On the release page, each file has its checksum beside it, starting `sha256:`. Work out the same number for your copy and compare.

| System | Run this in the folder with the files |
|---|---|
| Windows (PowerShell) | `Get-FileHash main.js` |
| macOS (Terminal) | `shasum -a 256 main.js` |
| Linux (terminal) | `sha256sum main.js` |

Do the same for `manifest.json`, `styles.css` or the zip. The long number must match the one on the release page (capital letters don't matter). If it doesn't, download the file again.

### Updating

1. Download the new `main.js`, `manifest.json` and `styles.css` from the latest release.
2. Put them in the `dungeons-and-dinthla` folder, replacing the old ones.
3. Restart Obsidian, or turn the plugin off and on again in **Settings → Community plugins**.

When a version adds something new, the dashboard shows one line about it after the update.

### Removing it

1. In **Settings → Community plugins**, turn **Dungeons & Dinthla** off.
2. Delete the `dungeons-and-dinthla` folder from the plugins folder.

Your campaign notes stay. They are ordinary notes you can keep reading and editing without the plugin.

### If something doesn't work

| What you see | What to do |
|---|---|
| Dungeons & Dinthla isn't in the *Installed plugins* list | Check the folder is named exactly `dungeons-and-dinthla` and holds the three files directly, not inside another folder. Then click the circular arrows, or restart Obsidian. |
| Obsidian says the plugin needs a newer version | Update Obsidian, then try again. |
| Opening the starter vault shows the notes but no plugin | You chose to browse in Restricted mode. Open **Settings → Community plugins**, press **Turn on community plugins**, then turn on Dungeons & Dinthla. |
| A campaign doesn't show up | Make sure the campaign's folder is inside the Campaigns folder you chose, and holds a note with the same name as the folder, such as `D&D/Pale Moon/Pale Moon.md`. |

Still stuck? [Open an issue](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/issues/new) and say what you did, what you expected and what happened instead.

### Build it yourself

Check out the release's tag (`git checkout 0.4.1`) and, with Node `^22.18.0 || ^24.0.0 || >=26.0.0`, run the following. It leaves the three files in the repository's root, byte for byte the same as the release's.

```
npm ci
npm run build
```

## Demo vault

`demo-vault/` is a small Obsidian vault with one made-up campaign, *Curse of the Pale Moon*, kept in the note format below. It shows what `main` can do after each merge, without touching your own vault.

1. Run `npm run build`. It builds `main.js` and `styles.css`, then copies them and `manifest.json` into the demo vault's plugin folder.
2. In Obsidian, choose **Open folder as vault** and pick `demo-vault`.
3. When Obsidian asks whether you trust the vault's author, choose **Trust author and enable plugins**. Dungeons & Dinthla is then turned on under Community plugins.
4. The demo campaign sits in `D&D/Curse of the Pale Moon/`. If the campaign tab asks for the Campaigns folder, choose `D&D`.

After the next build, reload the vault (**Reload app without saving** in the command palette, or Ctrl+R on desktop) to see the newest version. When the note format changes, the demo notes change in the same pull request, and each pull request says what to look for in the demo vault.

## Look

Everything the plugin draws follows Obsidian's active theme, light, dark or a community theme such as an Omarchy theme: its colours, fonts, font sizes, corners, spacing and shadows are Obsidian's own, and change when the theme does. Where a colour must stay readable on any theme, the plugin takes a colour from the theme and lightens or darkens it toward the theme's text colour. `tests/styles/literal-colours.test.ts` fails if a stylesheet or source file writes a literal colour.

`styles.css` is built from `styles/` by `npm run build`. `tests/styles/contrast.test.ts` checks the plugin's contrast pairs in Obsidian's default light and dark themes, Tokyo Night and Catppuccin Latte.

### Dollar lines stay plain

1. Write two item changes in a session, such as `$$ Potion of healing :used` and, a few lines later, `$$ Rope :lost`.
2. Obsidian would read every line from the first one on as maths, since no line ends in `$$`. In your campaign's notes it doesn't: the campaign tab shows each line as you wrote it, and so do a preview of the note and the note embedded in another, dollar signs and all, leaving out anything you hid in a `%% %%` comment.
3. In a note outside your campaigns, Obsidian draws maths as usual.

## Notes

[docs/note-format.md](docs/note-format.md) says how a campaign is kept in plain notes: the folders, sessions, marked lines and character facts the plugin reads and writes.

## Importing a character from D&D Beyond

In the plugin, press *Import from D&D Beyond* on the Characters page, paste your character's link or number and press *Bring in from D&D Beyond*. The plugin asks once, on each device, before it sends anything (see *Network use* below). Or bring your character in from its PDF: on D&D Beyond, open your character, choose *Manage* next to the name, then *Export to PDF* at the bottom of the menu, and choose that file in the same dialog. A PDF is read on your device and sends nothing anywhere. Either way the plugin shows what will be written before it writes. Online, D&D Beyond sends only the base scores, bonuses and modifiers, so the plugin works out your scores, modifiers, armor class, hit points, initiative, speed, saving throws, skills, passive scores, proficiency bonus and more itself, shows the working, and leaves a number as *Not known yet* with its reason when the rules cannot work it out (a speed set by hand, say). A score or hit points you set by hand on D&D Beyond win. [docs/note-format.md](docs/note-format.md#importing-online) has the details.

A short walkthrough:

1. On the Characters page, press *Import from D&D Beyond*, type your character's link and press *Bring in from D&D Beyond* (or export a PDF on D&D Beyond and choose that file instead); check what comes in and press *Import*.
2. Your character's sheet opens, and the plugin offers to make them your character in this campaign. Under the values you'll find your inventory, purse, spells and features, as D&D Beyond has them.
3. Press *Track on the funds page* beside an item to give it to your character on the Party funds page, where the party can see it.
4. Your own purse shows on the Party funds page, in its *Mine* tab, once the campaign note names your character. A `$` line with a link to your character anywhere on it, like `$ Flame Tongue longsword found by [[Mira]]` or `$ 30 gp from the bandits, share to [[Mira]]`, goes on your list there, items and coin. *Mine* has one *Purse*, and its *Add coin* writes the line for your character. The party purse and the rest of the lines are in the *Party* tab, and your purse is never added to it.
5. *Update from D&D Beyond* is on the sheet of every character in the campaign's `Characters` folder, including a character you wrote by hand, so you can bring them in from D&D Beyond or a PDF at any time. After a level-up, press it on your sheet and bring your character in again, online or by a new PDF. A character you brought in online keeps their D&D Beyond number in their note, so *Update from D&D Beyond* asks for them straight away: check the changes and press *Update*. Anything you hold on the funds page that the new sheet doesn't list is marked; pick *Used up*, *Sold*, *Lost* or *Changed* to settle it.

When a character leaves play:

1. Import your next character. The plugin asks what happened to the one you played: *Died*, *Retired* or *Backup*.
2. For *Died* or *Retired*, you can say what they were last doing. Their note moves to the campaign's `Fallen` folder with a dated snapshot added at the bottom, and the new character becomes yours.
3. A *Backup* stays in `Characters`. You'll find your backups at the bottom of the Characters page, each with *Make main* for when you want to play them, and the *Fallen* list sits below them.
4. Fallen characters are listed on the Characters page under *Fallen*, each with *Make main*. Their note moves back to `Characters` and keeps its snapshots; if they leave play again, another dated snapshot is added.
5. If a switch stops part way, the message says what was written. Press *Make main* again to finish it.
6. To take a character out of the adventure without bringing in another, open their page and press *Depart* at the very bottom. Choose *Died* or *Retired*, or write what happened under *Something else*, such as *Joined the Silver Order*, and press *Something else*. Their note moves to `Fallen`, and the Characters page marks them with your words.

### Agreeing to the online import

The plugin can fetch your character from D&D Beyond with one button, and it asks first, once for the whole vault:

1. After you make a campaign on the welcome page, you'll see *Bringing your character in*: three short sentences on what the online import sends.
2. Press *Agree* if that's fine with you, or *Not yet* to decide later. Either way, the page moves on.
3. *Agree* is kept in the plugin's settings in your vault, so another device you sync to doesn't ask again. If you skipped the step, the first press of the online button asks instead, with *Cancel* and *Import*. If you pressed *Not yet*, the step comes back only when you open the welcome page again with *Show this again* in the plugin's settings, and the online button will ask at its first press.

[docs/note-format.md](docs/note-format.md#the-dd-beyond-agreement) has the words and where the answer is kept.

## Network use

The plugin reads and writes only inside your Campaigns folder, and it sends nothing anywhere, with one exception: bringing your character in from D&D Beyond online, which is a manual button press. Nothing runs in the background, the plugin adds no login or cookies, and your agreement is kept in the plugin's settings in your vault, so a device the vault syncs to carries it.

- **What is sent.** One GET to `https://character-service.dndbeyond.com/character/v5/character/` followed by your character's number, and nothing else: this plugin adds no login, cookies or other headers of its own, and no body. Obsidian sends the call and may add its own details, and follows redirects. Nothing from the rest of a link you paste reaches the address.
- **When.** Only when you press *Bring in from D&D Beyond*, or *Update from D&D Beyond* for a character whose note keeps their number, after you have agreed once in this vault. Never in the background, never on a timer, never again by itself, with no retries and nothing cached. One call at a time, ten seconds apart at least, and the plugin stops waiting after fifteen seconds.
- **What comes back and what is kept.** The character's data. The plugin checks it (status 200, JSON, at most 5 MB, the number you asked for), reads from it only what the import shows, and throws the rest away, including your character's backstory and notes. Nothing is written to your vault until you press *Import* or *Update* on the review.
- **Public characters only.** The character must be set to Public on D&D Beyond, which makes its data, notes and backstory included, readable by anyone with the link.
- **Keep your link safe.** You are responsible for keeping the link or number of your public character safe: anyone who has it can read that character.
- **D&D Beyond's terms don't authorise this.** There is no official way to read a character's data. The address is the one D&D Beyond's own pages use, it is undocumented, and it can change or close without notice; the PDF route still works then.
- **What the plugin cannot rule out.** Obsidian's request follows redirects and can't be told not to, so the checks are on whatever finally answers. On the desktop app Obsidian's own request may carry any cookie Obsidian itself holds for that site, normally none, since nobody signs in to D&D Beyond inside Obsidian. D&D Beyond sees your device's address and your character's number.
- **How it is kept to that.** The built `main.js` holds exactly this one call and this one address, and every pull request and release fails if it holds anything more; `styles.css` may hold no address at all. [docs/note-format.md](docs/note-format.md#the-campaigns-folder) lists what is checked.

## Planning

Work is planned as epics, stories and tasks in the repository's issues.
