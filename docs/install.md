# Installing Dungeons & Dinthla

The plugin is not in Obsidian's own plugin list yet, so it is installed from this repository's releases. You need Obsidian 1.10.3 or newer; *Settings → About* shows your version.

From the [latest release](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/releases/latest), under *Assets*, download either:

- `main.js`, `manifest.json` and `styles.css`, to add the plugin to your own vault, or
- the starter vault zip, to try it with a sample campaign without touching your own notes.

## The starter vault

1. Unzip it. You get a folder called **Dungeons & Dinthla starter vault**.
2. In Obsidian, choose **Open folder as vault** and pick that folder. If a vault is already open, click its name at the bottom left and choose **Manage vaults…** first.
3. When Obsidian asks whether you trust the author, choose **Trust author and enable plugins**.

On an iPhone or iPad, unzip it in the Files app and move the folder into the **Obsidian** folder, then pick the vault from Obsidian's list.

## Your own vault, on a computer

1. In Obsidian, open **Settings → Community plugins**. If you see **Turn on community plugins**, press it.
2. Click the folder icon next to **Installed plugins**. Your vault's plugins folder opens.
3. Make a folder named exactly `dungeons-and-dinthla` and put the three files directly in it.
4. Click the circular arrows next to *Installed plugins*, and turn on **Dungeons & Dinthla**.

If there is no folder icon, the plugins folder is `.obsidian/plugins` inside your vault. Folders starting with a dot are hidden: show them with **View → Hidden items** on Windows, **Cmd + Shift + .** on a Mac, or **Ctrl + H** in most Linux file managers. If there is no `plugins` folder, make one.

## Your own vault, on a phone or tablet

- **If the vault syncs** (Obsidian Sync, iCloud, Syncthing or Git), install the plugin on a computer and let it sync. Then turn on community plugins and **Dungeons & Dinthla** on the device. With Obsidian Sync, also tick *Installed community plugins* in its settings.
- **If it does not sync**, use a file manager on the device to make `.obsidian/plugins/dungeons-and-dinthla` inside the vault, put the three files in it, then turn the plugin on.

## Updating and removing

To update, put the new three files over the old ones and restart Obsidian.

To remove it, turn it off under **Settings → Community plugins** and delete the `dungeons-and-dinthla` folder. Your campaign notes stay; they are ordinary notes.

## Checking the files

The release page shows each file's checksum, starting `sha256:`. To compare, run one of these in the folder with the files:

- Windows (PowerShell): `Get-FileHash main.js`
- macOS: `shasum -a 256 main.js`
- Linux: `sha256sum main.js`

If a number does not match, download that file again.

## When something does not work

- **The plugin is not in *Installed plugins*.** Check that the folder is named exactly `dungeons-and-dinthla` and holds the three files directly, not inside another folder. Then click the circular arrows, or restart Obsidian.
- **Obsidian says the plugin needs a newer version.** Update Obsidian.
- **The starter vault shows notes but no plugin.** It was opened in Restricted mode. Turn on community plugins, then the plugin.
- **A campaign does not show up.** Its folder must be inside your Campaigns folder and hold a note with the same name, such as `D&D/Pale Moon/Pale Moon.md`.

Still stuck? [Open an issue](https://github.com/Libertas-le-Spes/dungeons-and-dinthla/issues/new) and say what you did, what you expected and what happened.
