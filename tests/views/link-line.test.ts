import { describe, expect, it, vi } from "vitest";
import type { TFile } from "obsidian";
import { CampaignStore } from "../../src/campaign/campaign-store";
import { noteTextsOf } from "../../src/campaign/note-texts";
import type { Gate } from "../../src/fence/gatekeeper";
import { linkLineOf, type LinkLines } from "../../src/views/link-line";
import { FakeVault } from "../campaign/fake-vault";

const CAMPAIGN = "D&D/Pale Moon";
const SESSION = `${CAMPAIGN}/Sessions/Session 1.md`;
const LANTERN = `${CAMPAIGN}/Items/Silvered lantern.md`;

function gateHolding(path: string, disk: string): Gate {
  const file = { path } as TFile;
  const files = {
    getFileByPath: (asked: string) => {
      if (asked !== path) return null;
      return file;
    },
    read: async () => disk,
  };
  return { files } as unknown as Gate;
}

async function linesOf(sessionDisk: string, notePath: string, noteDisk: string) {
  const store = new CampaignStore(new FakeVault([{ path: SESSION, text: sessionDisk }]).vault);
  await store.open(CAMPAIGN);
  const lines: LinkLines = { sessions: store, texts: noteTextsOf(gateHolding(notePath, noteDisk)) };
  return { store, lines };
}

describe("linkLineOf", () => {
  it("gives the session line as the campaign holds it, unsaved text and all", async () => {
    const { store, lines } = await linesOf("We rode on.\nRain.", LANTERN, "");
    store.noteChanged(SESSION, "We rode on.\n? Who sent [[Lady Vess]]\nRain.");
    expect(await linkLineOf(lines, { path: SESSION, line: 1 })).toBe("? Who sent [[Lady Vess]]");
  });

  it("counts a session's lines as the campaign counts them, a lone carriage return not ending one", async () => {
    const { lines } = await linesOf("We rode on.\rRain.\n? Who sent [[Lady Vess]]", LANTERN, "");
    expect(await linkLineOf(lines, { path: SESSION, line: 1 })).toBe("? Who sent [[Lady Vess]]");
  });

  it("counts another note's lines as its panel counts them, a lone carriage return ending one", async () => {
    const { lines } = await linesOf("", LANTERN, "Found in the mill.\rGiven to @[[Old Tom]].");
    expect(await linkLineOf(lines, { path: LANTERN, line: 1 })).toBe("Given to @[[Old Tom]].");
  });

  it("reads no note when the line isn't known", async () => {
    const { store } = await linesOf("", LANTERN, "");
    const read = vi.fn(async () => "Given to @[[Old Tom]].");
    expect(await linkLineOf({ sessions: store, texts: { read } }, { path: LANTERN, line: null })).toBe("");
    expect(read).not.toHaveBeenCalled();
  });

  it("gives nothing for a line past the end of its note", async () => {
    const { lines } = await linesOf("We rode on.", LANTERN, "");
    expect(await linkLineOf(lines, { path: SESSION, line: 5 })).toBe("");
  });

  it("gives nothing for a note that is gone", async () => {
    const { lines } = await linesOf("", LANTERN, "");
    expect(await linkLineOf(lines, { path: `${CAMPAIGN}/Items/Rope.md`, line: 0 })).toBe("");
  });
});
