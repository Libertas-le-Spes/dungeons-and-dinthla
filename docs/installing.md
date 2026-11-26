# Installing Dungeons & Dinthla

Dungeons & Dinthla is a plugin for [Obsidian](https://obsidian.md), the free note-taking app. You write what happens at the table in your session notes, and the plugin keeps track of the open questions, quests and money, and fills in sheets for the people and places you meet.

The plugin isn't in Obsidian's built-in plugin list, so you install it from this page's downloads. It takes about five minutes.

## What you need

- **Obsidian 1.10.3 or newer**, on a computer, phone or tablet. To see your version, open *Settings → About* in Obsidian. Get Obsidian from [obsidian.md](https://obsidian.md/download).
- **The files from the latest release.** Open the [latest release](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/releases/latest) and scroll to *Assets*. There are four files:

| File | What it's for |
|---|---|
| `dungeons-and-dinthla-starter-vault-<version>.zip` | Trying the plugin with a sample campaign, without touching your own notes |
| `main.js`, `manifest.json`, `styles.css` | Adding the plugin to your own vault |

A *vault* is Obsidian's word for a folder of notes.

## Option 1: try it in the starter vault

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

## Option 2: add it to your own vault

### On a computer

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

### On a phone or tablet

The easiest way is through a computer:

- **If your vault syncs** (Obsidian Sync, iCloud, Syncthing or Git): add the plugin on a computer as above and let the vault sync. Then, on the phone or tablet, open **Settings → Community plugins**, turn on community plugins if asked, and turn on **Dungeons & Dinthla**. With Obsidian Sync, also make sure *Installed community plugins* is ticked in its settings.
- **If it doesn't sync:** use a file manager on the device to make the `dungeons-and-dinthla` folder inside the vault's `.obsidian/plugins` folder and put the three files in it, as in step 5. Then do steps 2, 3, 6 and 7 in Obsidian.

## Check the files (optional)

You can check that the files you downloaded are exactly the ones published. On the release page, each file has its checksum beside it, starting `sha256:`. Work out the same number for your copy and compare.

| System | Run this in the folder with the files |
|---|---|
| Windows (PowerShell) | `Get-FileHash main.js` |
| macOS (Terminal) | `shasum -a 256 main.js` |
| Linux (terminal) | `sha256sum main.js` |

Do the same for `manifest.json`, `styles.css` or the zip. The long number must match the one on the release page (capital letters don't matter). If it doesn't, download the file again.

## Updating

1. Download the new `main.js`, `manifest.json` and `styles.css` from the latest release.
2. Put them in the `dungeons-and-dinthla` folder, replacing the old ones.
3. Restart Obsidian, or turn the plugin off and on again in **Settings → Community plugins**.

When a version adds something new, the dashboard shows one line about it after the update.

## Removing it

1. In **Settings → Community plugins**, turn **Dungeons & Dinthla** off.
2. Delete the `dungeons-and-dinthla` folder from the plugins folder.

Your campaign notes stay. They are ordinary notes you can keep reading and editing without the plugin.

## If something doesn't work

| What you see | What to do |
|---|---|
| Dungeons & Dinthla isn't in the *Installed plugins* list | Check the folder is named exactly `dungeons-and-dinthla` and holds the three files directly, not inside another folder. Then click the circular arrows, or restart Obsidian. |
| Obsidian says the plugin needs a newer version | Update Obsidian, then try again. |
| Opening the starter vault shows the notes but no plugin | You chose to browse in Restricted mode. Open **Settings → Community plugins**, press **Turn on community plugins**, then turn on Dungeons & Dinthla. |
| A campaign doesn't show up | Make sure the campaign's folder is inside the Campaigns folder you chose, and holds a note with the same name as the folder, such as `D&D/Pale Moon/Pale Moon.md`. |

Still stuck? [Open an issue](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/issues/new) and say what you did, what you expected and what happened instead.

## What it sends over the internet

Nothing, unless you ask it to. The one exception is **Import from D&D Beyond** online: when you press it, and only after you've agreed to it, the plugin asks D&D Beyond for that one character, which has to be set to Public there. Bringing a character in from its PDF reads the file on your device and sends nothing. The [Network use](../README.md#network-use) section of the README has the details.
