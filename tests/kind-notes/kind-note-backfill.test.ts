import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../src/campaign/reading/build-campaign";
import type { SessionNote } from "../../src/campaign/record/campaign";
import { KindNoteBackfill } from "../../src/kind-notes/kind-note-backfill";
import type { WantedNote } from "../../src/kind-notes/wanted-note";
import { fileAt } from "./fake-notes";
import { CAMPAIGN } from "./keeper-setup";

function session(number: number, text: string): SessionNote {
  return { path: `${CAMPAIGN}/Sessions/Session ${number}.md`, number, text, firstLine: 0 };
}

function backfillWith(sessions: SessionNote[], alreadyMade: string[] = [], makes: (note: WantedNote) => boolean = () => true) {
  const calls: string[] = [];
  let inside = 0;
  let mostInside = 0;
  const makeIfMissing = vi.fn(async (note: WantedNote) => {
    inside += 1;
    mostInside = Math.max(mostInside, inside);
    await Promise.resolve();
    inside -= 1;
    calls.push(note.path);
    return note.lines.length > 0 && makes(note);
  });
  const marked: string[] = [];
  const made = { hasMadeFor: (folder: string) => alreadyMade.includes(folder), markMadeFor: vi.fn(async (folder: string) => void marked.push(folder)) };
  const say = vi.fn();
  const store = { current: buildCampaign(sessions), sessionNotes: sessions };
  const files = { getFileByPath: (path: string) => fileAt(path) };
  const backfill = new KindNoteBackfill({ store, files, keeper: { makeIfMissing }, made, say });
  return { backfill, calls, marked, say, made, makeIfMissing, mostInside: () => mostInside };
}

describe("KindNoteBackfill", () => {
  it("makes the notes of the sessions written before, one session at a time in order, and says how many sessions got notes", async () => {
    const { backfill, calls, say } = backfillWith([session(2, "? Who sent Mira"), session(1, "$ 5 gp rooms")]);
    await backfill.run(CAMPAIGN);
    expect(calls).toEqual([
      `${CAMPAIGN}/Questions/Session 1.md`,
      `${CAMPAIGN}/Quests/Session 1.md`,
      `${CAMPAIGN}/Funds/Session 1.md`,
      `${CAMPAIGN}/Questions/Session 2.md`,
      `${CAMPAIGN}/Quests/Session 2.md`,
      `${CAMPAIGN}/Funds/Session 2.md`,
    ]);
    expect(say).toHaveBeenCalledExactlyOnceWith("Made notes for 2 sessions.");
  });

  it("makes one note at a time", async () => {
    const { backfill, mostInside } = backfillWith([session(1, "? Who sent Mira"), session(2, "! Find the caravan")]);
    await backfill.run(CAMPAIGN);
    expect(mostInside()).toBe(1);
  });

  it("asks the keeper for each note with the lines its session holds", async () => {
    const { backfill, makeIfMissing } = backfillWith([session(1, "? Who sent Mira")]);
    await backfill.run(CAMPAIGN);
    const lines = makeIfMissing.mock.calls.map(([note]) => note.lines);
    expect(lines).toEqual([["? Who sent Mira"], [], []]);
  });

  it("counts a session once however many of its notes were made, and says 1 session in the singular", async () => {
    const { backfill, say } = backfillWith([session(1, "? Who sent Mira\n! Find the caravan\n$ 5 gp rooms")]);
    await backfill.run(CAMPAIGN);
    expect(say).toHaveBeenCalledExactlyOnceWith("Made notes for 1 session.");
  });

  it("doesn't count a session whose notes were all there already, and says nothing when none were made", async () => {
    const { backfill, say } = backfillWith([session(1, "? Who sent Mira")], [], () => false);
    await backfill.run(CAMPAIGN);
    expect(say).not.toHaveBeenCalled();
  });

  it("marks the campaign done after it ran, even when no note was made", async () => {
    const { backfill, marked } = backfillWith([session(1, "We rested.")]);
    await backfill.run(CAMPAIGN);
    expect(marked).toEqual([CAMPAIGN]);
  });

  it("does nothing for a campaign it already made notes for", async () => {
    const { backfill, makeIfMissing, made, say } = backfillWith([session(1, "? Who sent Mira")], [CAMPAIGN]);
    await backfill.run(CAMPAIGN);
    expect(makeIfMissing).not.toHaveBeenCalled();
    expect(made.markMadeFor).not.toHaveBeenCalled();
    expect(say).not.toHaveBeenCalled();
  });

  it("makes the notes of a campaign when only another campaign was marked", async () => {
    const { backfill, makeIfMissing } = backfillWith([session(1, "? Who sent Mira")], ["D&D/Silver Road"]);
    await backfill.run(CAMPAIGN);
    expect(makeIfMissing).toHaveBeenCalled();
  });

  it("tells the caller when it couldn't mark the campaign done", async () => {
    const { backfill, made } = backfillWith([session(1, "? Who sent Mira")]);
    made.markMadeFor.mockRejectedValueOnce(new Error("disk full"));
    await expect(backfill.run(CAMPAIGN)).rejects.toThrow("disk full");
  });
});
