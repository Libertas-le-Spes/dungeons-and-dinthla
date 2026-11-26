# Installing Dungeons & Dinthla

Dungeons & Dinthla is a plugin for [Obsidian](https://obsidian.md), the note-taking app. You write what happens at the table in your session notes, and the plugin keeps track of the open questions, quests and money, and fills in sheets for the people and places you meet.

It isn't in Obsidian's own list of community plugins, so you install it from this repository's [releases](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/releases). Each release has four files:

| File | What it is |
|---|---|
| `dungeons-and-dinthla-starter-vault-<version>.zip` | A ready vault to try the plugin in, with a sample campaign |
| `main.js`, `manifest.json`, `styles.css` | The plugin itself, for adding to your own vault |

This page may lag behind the plugin as it changes; whoever changes what it describes updates it in the same change.

## Try it in the starter vault

The quickest way to see what the plugin does, without touching your own notes.

1. Open the [latest release](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/releases/latest) and download `dungeons-and-dinthla-starter-vault-<version>.zip`.
2. Unzip it. You get a folder called *Dungeons & Dinthla starter vault*.
3. In Obsidian, open the vault switcher (the vault's name at the bottom left, or *Open another vault* in the menu) and choose *Open folder as vault*. Pick the unzipped folder.
4. Obsidian asks whether you trust the author of the vault. Choose *Trust author and enable plugins*.

The plugin's welcome page opens. The sample campaign, *Curse of the Pale Moon*, has three sessions, a few characters and an item to look around.

On a phone or tablet, put the unzipped folder where Obsidian keeps its vaults first. On Android, any folder works: choose *Open folder as vault* and pick it. On an iPhone or iPad, move it into the *Obsidian* folder in the Files app (*On My iPhone* or *iCloud Drive*), and it shows up in Obsidian's list of vaults.

## Add it to your own vault

1. Open the [latest release](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/releases/latest) and download `main.js`, `manifest.json` and `styles.css`.
2. In your vault's folder, open the hidden `.obsidian` folder, then `plugins` (make it if it isn't there), and make a folder called `dungeons-and-dinthla` inside it. Put the three files there:
   ```
   <your vault>/.obsidian/plugins/dungeons-and-dinthla/main.js
   <your vault>/.obsidian/plugins/dungeons-and-dinthla/manifest.json
   <your vault>/.obsidian/plugins/dungeons-and-dinthla/styles.css
   ```
   Folders starting with a dot are hidden on most computers: on Windows, tick *Hidden items* under *View* in File Explorer; on a Mac, press Cmd + Shift + . in Finder.
3. In Obsidian, open *Settings → Community plugins*. If it says Restricted mode is on, press *Turn on community plugins*.
4. Restart Obsidian, or press the circular arrows beside *Installed plugins*, so it finds the new plugin.
5. Turn on **Dungeons & Dinthla** in that list.

The plugin's welcome page opens and asks for your **Campaigns folder**: the one folder of your vault where your campaigns live, such as `D&D`. The plugin reads and writes only inside that folder and does nothing until you choose it, so the rest of your vault stays out of its reach. Then make your first campaign on the same page.

### On a phone or tablet

If your vault syncs between devices (with Obsidian Sync, iCloud or a Git repository), add the three files on a computer as above and let them sync; then do steps 3 to 5 on the phone or tablet. Otherwise, copy the `dungeons-and-dinthla` folder into the vault's `.obsidian/plugins` folder on the device with its file manager, and do steps 3 to 5 there.

## Check the files (optional)

Each file on the release page has its SHA-256 checksum written beside it, as `sha256:…`. To be sure your download is the one published, compare it with the file's own checksum:

| System | Command, run in the download folder |
|---|---|
| Windows (PowerShell) | `Get-FileHash main.js` |
| macOS | `shasum -a 256 main.js` |
| Linux | `sha256sum main.js` |

The long number printed must match the one on the release page, ignoring capital letters.

## Update

Download the new release's `main.js`, `manifest.json` and `styles.css` and put them over the old ones in the same folder. Obsidian uses the new version after it restarts, or after you turn the plugin off and on in *Settings → Community plugins*. After an update with something new, the dashboard shows one line saying what it is.

## Remove

Turn the plugin off in *Settings → Community plugins*, then delete the `dungeons-and-dinthla` folder from `.obsidian/plugins`. Your campaign notes stay, as ordinary notes.

## What it sends over the internet

Nothing, unless you ask it to. The one exception is *Import from D&D Beyond* online: when you press the button, after agreeing once, the plugin asks D&D Beyond for that one character, which must be set to Public there. Bringing a character in from its PDF reads the file on your device and sends nothing anywhere. The README's [Network use](../README.md#network-use) section has the details.

## Something wrong?

Open an [issue](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/issues) and say what you did, what you expected and what happened instead.
