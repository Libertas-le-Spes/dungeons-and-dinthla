import { describe, expect, it } from "vitest";
import { readSessions } from "../../src/campaign/read-campaign";
import { FakeVault } from "./fake-vault";

describe("readSessions", () => {
  it("reads the campaign's session notes, each with its number and where its body starts", async () => {
    const fake = new FakeVault([
      { path: "Pale Moon/Sessions/Session 10.md", text: "? Later" },
      { path: "Pale Moon/Sessions/Session 9.md", text: "---\nplayed: 2026-03-14\n---\n? Earlier" },
    ]);
    const sessions = await readSessions(fake.vault, "Pale Moon");
    expect(sessions.map(({ path, number, firstLine }) => [path, number, firstLine])).toEqual([
      ["Pale Moon/Sessions/Session 10.md", 10, 0],
      ["Pale Moon/Sessions/Session 9.md", 9, 3],
    ]);
  });

  it("leaves out notes that aren't this campaign's sessions", async () => {
    const fake = new FakeVault([
      { path: "Pale Moon/Sessions/Session 1.md", text: "? Kept" },
      { path: "Pale Moon/Sessions/Notes.md", text: "? Not a session" },
      { path: "Pale Moon/Session 4.md", text: "? Outside the Sessions folder" },
      { path: "Ashen Road/Sessions/Session 1.md", text: "? Another campaign" },
    ]);
    const sessions = await readSessions(fake.vault, "Pale Moon");
    expect(sessions.map((session) => session.text)).toEqual(["? Kept"]);
  });

  it("reads a campaign with no sessions as none", async () => {
    expect(await readSessions(new FakeVault([]).vault, "Pale Moon")).toEqual([]);
  });
});
