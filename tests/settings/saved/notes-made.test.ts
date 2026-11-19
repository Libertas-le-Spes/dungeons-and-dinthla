import { describe, expect, it, vi } from "vitest";
import { NotesMade } from "../../../src/settings/saved/notes-made";
import { SettingsSaver } from "../../../src/settings/saved/settings-saver";

const FRESH = { campaignsFolder: "D&D", campaignFolder: null, welcomeSeen: true, lastVersionSeen: null, notesMadeFor: [], beyondAgreed: false };

function notesMadeWith(notesMadeFor: string[]) {
  const write = vi.fn(async () => {});
  const saver = new SettingsSaver({ ...FRESH, notesMadeFor }, write);
  return { made: new NotesMade(saver), write };
}

describe("NotesMade", () => {
  it("says a campaign hasn't had its notes made until it is marked", async () => {
    const { made } = notesMadeWith([]);
    expect(made.hasMadeFor("D&D/Pale Moon")).toBe(false);
    await made.markMadeFor("D&D/Pale Moon");
    expect(made.hasMadeFor("D&D/Pale Moon")).toBe(true);
  });

  it("keeps the campaigns marked before, and writes the settings once for each new one", async () => {
    const { made, write } = notesMadeWith(["D&D/Silver Road"]);
    await made.markMadeFor("D&D/Pale Moon");
    expect(write).toHaveBeenCalledExactlyOnceWith({ ...FRESH, notesMadeFor: ["D&D/Silver Road", "D&D/Pale Moon"], beyondAgreed: false });
  });

  it("writes nothing for a campaign already marked", async () => {
    const { made, write } = notesMadeWith(["D&D/Pale Moon"]);
    await made.markMadeFor("D&D/Pale Moon");
    expect(write).not.toHaveBeenCalled();
  });
});
