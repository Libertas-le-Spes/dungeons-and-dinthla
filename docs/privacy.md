# Privacy

The plugin reads and writes only inside your Campaigns folder. It sends one thing over the network: a request to D&D Beyond for your character, and only when you press the button for it.

## Your vault

- **Only the Campaigns folder.** Every read and write goes through one gatekeeper that refuses any path outside the folder you chose. Until you choose one, the plugin reads and writes nothing.
- **One gap: links on your disk.** The plugin checks paths, so it can't tell where a folder really is. A symbolic link (or, on Windows, a junction) inside the Campaigns folder that points elsewhere lets the plugin reach there too. Keep such links out of the Campaigns folder.
- **What it keeps of its own.** The plugin's settings file, `.obsidian/plugins/dungeons-and-dinthla/data.json`, holds the Campaigns folder, the campaign you were last in, whether you've seen the welcome page and the latest news, and whether you agreed to the online import. It syncs with your vault.
- **What stays on one device.** Text you typed in the campaign tab but haven't saved is kept in Obsidian's storage on that device. It never goes into the vault, so it doesn't sync.

## The one network request

### When

Only when you press *Bring in from D&D Beyond*, or *Update from D&D Beyond* for a character brought in online. Never in the background, on a timer or by itself. There are no retries and nothing is cached.

### Agreeing first

The first time, the plugin asks:

> **Bring in your character from D&D Beyond?**
>
> The plugin asks D&D Beyond for your character by its number, and sends nothing else. The character must be set to Public there, so anyone with its link can see it. Its backstory and notes are never saved.

It asks on the welcome page (*Agree* or *Not yet*) or at your first press of the online button (*Import* or *Cancel*). *Not yet* and *Cancel* keep nothing and send nothing.

Your agreement is kept **once for the whole vault**, in `data.json`. A phone or tablet your vault syncs to has it too and doesn't ask again. So does anyone you give a copy of the vault with its `.obsidian` folder; leave `data.json` out of a vault you share. There's no setting to take the agreement back yet.

### What is sent

One GET request to:

```
https://character-service.dndbeyond.com/character/v5/character/<your character's number>
```

The plugin takes only the number from what you paste; the rest of a link never reaches the address. It adds no login, cookies, headers or body of its own. Obsidian sends the request and may add its own details.

### Limits

- One request at a time, and at least ten seconds between presses.
- The plugin stops waiting after fifteen seconds and ignores a late answer.
- It accepts only a successful JSON answer of at most 5 MB, for the number it asked for. Anything else is refused with a plain message, such as *This character is private on D&D Beyond. Set it to Public there, or use a PDF instead.*

### What is kept

The plugin reads from the answer only what the import shows, and drops the rest, including your character's backstory and notes. Nothing is written to your vault until you press *Import* or *Update*.

### What you should know

- **Public means public.** A character set to Public on D&D Beyond can be read by anyone with its link or number. Keep the link to yourself.
- **D&D Beyond sees the request.** It sees your device's address and your character's number.
- **Redirects are followed.** Obsidian follows them and can't be told not to, so the checks above apply to whatever finally answers.
- **Cookies.** On a computer, Obsidian may send any cookie it holds itself for D&D Beyond. Normally there are none, since nobody signs in to D&D Beyond inside Obsidian.
- **No official support.** D&D Beyond has no official way to read a character. The address is the one its own pages use. It can change or close without notice, and its terms don't cover this use. The PDF route always works and sends nothing.

## How this is checked

Every pull request and release fails if the released `main.js` holds any network code other than this one request, or if `styles.css` holds any web address at all. A test also scans the source for code that could get round the Campaigns folder's gatekeeper. These checks look for known patterns. They can't prove the code is safe, so every change is also reviewed by hand.
