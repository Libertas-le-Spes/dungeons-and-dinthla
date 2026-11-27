# Privacy

The plugin reads and writes only inside your Campaigns folder. It sends one thing over the network: a request to D&D Beyond for your character, and only when you press the button for it.

## Your vault

- **Only the Campaigns folder.** Every read and write goes through one gatekeeper that refuses any path outside the folder you chose. Until you choose one, the plugin reads and writes nothing.
- **One gap: links on your disk.** The plugin checks paths, so it cannot tell where a folder really is. A symbolic link (or, on Windows, a junction) inside the Campaigns folder that points elsewhere lets the plugin reach there too. Keep such links out of the Campaigns folder.
- **Its own settings.** `.obsidian/plugins/dungeons-and-dinthla/data.json` holds the Campaigns folder, the campaign you were last in, whether you have seen the welcome page and the latest news, and whether you agreed to the online import. It syncs with your vault.
- **Unsaved text.** What you type in the campaign tab but have not saved is kept in Obsidian's storage on that device only. It never goes into the vault.

## The one network request

**When.** Only when you press *Bring in from D&D Beyond*, or *Update from D&D Beyond* for a character brought in online. Never in the background or on a timer. There are no retries and nothing is cached.

**Agreeing first.** The plugin asks before the first request, either on the welcome page or at your first press. The answer is kept once for the whole vault, in `data.json`, so a phone or tablet your vault syncs to does not ask again. Neither does anyone you give a copy of the vault with its `.obsidian` folder, so leave `data.json` out of a vault you share. There is no setting to take the agreement back yet.

**What is sent.** One GET request to:

```
https://character-service.dndbeyond.com/character/v5/character/<your character's number>
```

Only the number is taken from what you paste; the rest of a link never reaches the address. The plugin adds no login, cookies, headers or body of its own. Obsidian sends the request and may add its own details.

**Limits.** One request at a time, at least ten seconds between presses, and no waiting past fifteen seconds. Only a successful JSON answer of at most 5 MB, for the number that was asked for, is accepted.

**What is kept.** Only what the import shows. The rest of the answer, including the character's backstory and notes, is dropped. Nothing is written to your vault until you press *Import* or *Update*.

## What you should know

- **Public means public.** A character set to Public on D&D Beyond can be read by anyone with its link or number.
- **D&D Beyond sees the request.** It sees your device's address and your character's number.
- **Redirects are followed.** Obsidian follows them and cannot be told not to, so the checks above apply to whatever finally answers.
- **Cookies.** On a computer, Obsidian may send a cookie it holds itself for D&D Beyond. Normally there are none, since nobody signs in to D&D Beyond inside Obsidian.
- **No official support.** D&D Beyond has no official way to read a character. The address is the one its own pages use, and it can change or close without notice. The PDF import always works and sends nothing.

## How this is checked

Every pull request and release fails if the released `main.js` holds any network code other than this one request, or if `styles.css` holds any web address. A test also scans the source for code that could get round the gatekeeper. These checks look for known patterns and cannot prove the code is safe, so every change is also reviewed by hand.
