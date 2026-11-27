# Installing Dungeons & Dinthla

The plugin isn't in Obsidian's own plugin list yet, so you install it from this repository's releases. It takes about five minutes.

## What you need

- **Obsidian 1.10.3 or newer**, on a computer, phone or tablet. *Settings → About* shows your version. Get Obsidian from [obsidian.md](https://obsidian.md/download).
- **The files from the [latest release](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/releases/latest)**, under *Assets*:

| File | What it's for |
|---|---|
| `dungeons-and-dinthla-starter-vault-<version>.zip` | Trying the plugin with a sample campaign, without touching your own notes |
| `main.js`, `manifest.json`, `styles.css` | Adding the plugin to your own vault |

A *vault* is Obsidian's word for a folder of notes.

## Option 1: try the starter vault

1. Download the starter vault zip and unzip it. You get a folder called **Dungeons & Dinthla starter vault**. Keep it somewhere you'll find again.
2. Open Obsidian.
   - On the start screen, choose **Open folder as vault**.
   - If a vault is already open, click its name at the bottom left, choose **Manage vaults…**, then **Open folder as vault**.
3. Pick the **Dungeons & Dinthla starter vault** folder.
4. When Obsidian asks *Do you trust the author of this vault?*, choose **Trust author and enable plugins**.

The welcome page opens, with a sample campaign, *Curse of the Pale Moon*, to look around.

**On a phone or tablet:**

- **Android:** unzip the file, open Obsidian, choose **Open folder as vault** and pick the folder. Then do step 4.
- **iPhone or iPad:** unzip the file in the Files app and move the folder into the **Obsidian** folder (under *On My iPhone*, *On My iPad* or *iCloud Drive*). Open Obsidian and pick the vault from its list. Then do step 4.

## Option 2: add it to your own vault

### On a computer

1. Download `main.js`, `manifest.json` and `styles.css`.
2. In Obsidian, open your vault, then **Settings → Community plugins**.
3. If you see **Turn on community plugins**, press it.
4. Next to **Installed plugins**, click the **folder icon**. Your vault's plugins folder opens.
5. In it, make a folder named exactly `dungeons-and-dinthla` and put the three files in it:
   ```
   plugins
   └── dungeons-and-dinthla
       ├── main.js
       ├── manifest.json
       └── styles.css
   ```
6. Back in Obsidian, click the **circular arrows** next to *Installed plugins*.
7. Turn on **Dungeons & Dinthla**.

If there's no folder icon, the plugins folder is `<your vault>/.obsidian/plugins`. Folders starting with a dot are hidden: on Windows tick **Hidden items** under **View** in File Explorer, on a Mac press **Cmd + Shift + .** in Finder, on Linux press **Ctrl + H** in most file managers. If `.obsidian` has no `plugins` folder, make one.

### On a phone or tablet

- **If your vault syncs** (Obsidian Sync, iCloud, Syncthing or Git): add the plugin on a computer and let the vault sync. On the phone or tablet, open **Settings → Community plugins**, turn on community plugins if asked, and turn on **Dungeons & Dinthla**. With Obsidian Sync, also tick *Installed community plugins* in its settings.
- **If it doesn't sync:** with a file manager on the device, make the `dungeons-and-dinthla` folder inside the vault's `.obsidian/plugins` folder and put the three files in it. Then do steps 2, 3, 6 and 7.

## First start

The welcome page asks for your **Campaigns folder**: the one folder of your vault where your campaigns live, such as `D&D`. The plugin does nothing until you choose it, and never touches anything outside it. Then make your first campaign on the same page.

You can change the folder later in the plugin's settings. To make another campaign, press the small arrows beside the campaign's name at the top of the campaign tab and choose *New campaign*.

## Updating

1. Download the new `main.js`, `manifest.json` and `styles.css`.
2. Put them in the `dungeons-and-dinthla` folder, over the old ones.
3. Restart Obsidian, or turn the plugin off and on again.

When a version adds something new, the dashboard shows one line about it.

## Removing it

1. In **Settings → Community plugins**, turn **Dungeons & Dinthla** off.
2. Delete the `dungeons-and-dinthla` folder from the plugins folder.

Your campaign notes stay. They are ordinary notes.

## Checking the files (optional)

Each file on the release page has its checksum beside it, starting `sha256:`. To check your copy, run this in the folder with the files and compare the long number:

| System | Command |
|---|---|
| Windows (PowerShell) | `Get-FileHash main.js` |
| macOS (Terminal) | `shasum -a 256 main.js` |
| Linux | `sha256sum main.js` |

Do the same for the other files. Capital letters don't matter. If a number doesn't match, download that file again.

## If something doesn't work

| What you see | What to do |
|---|---|
| Dungeons & Dinthla isn't in *Installed plugins* | Check the folder is named exactly `dungeons-and-dinthla` and holds the three files directly, not inside another folder. Click the circular arrows, or restart Obsidian. |
| Obsidian says the plugin needs a newer version | Update Obsidian. |
| The starter vault shows notes but no plugin | You chose Restricted mode. Open **Settings → Community plugins**, press **Turn on community plugins**, then turn on Dungeons & Dinthla. |
| A campaign doesn't show up | Its folder must be inside the Campaigns folder and hold a note with the same name, such as `D&D/Pale Moon/Pale Moon.md`. |

Still stuck? [Open an issue](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/issues/new) and say what you did, what you expected and what happened.
