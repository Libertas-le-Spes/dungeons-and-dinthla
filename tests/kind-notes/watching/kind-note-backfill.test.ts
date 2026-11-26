import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { KindNoteBackfill } from "../../../src/kind-notes/watching/kind-note-backfill";
import type { MakeResult } from "../../../src/note-keeping/make-result";
import type { WantedNote } from "../../../src/kind-notes/wanting/wanted-note";
import { fileAt } from "../fake-notes";
import { CAMPAIGN } from "../keeper-setup";

function session(number: number, text: string): SessionNote {
  return { path: `${CAMPAIGN}/Sessions/Session ${number}.md`, number, text, firstLine: 0 };
}

function backfillWith(sessions: SessionNote[], alreadyMade: string[] = [], makes: (note: WantedNote) => MakeResult = () => "made", itemsMade = 0, itemsFailed = 0) {
  const calls: string[] = [];
  const hooks = { whileMaking: (_note: WantedNote): void => {} };
  const whileMaking = (note: WantedNote) => hooks.whileMaking(note);
  let inside = 0;
  let mostInside = 0;
  const store = { current: buildCampaign(sessions), sessionNotes: sessions, campaignFolder: CAMPAIGN as string | null, opening: false };
  const makeIfMissing = vi.fn(async (note: WantedNote): Promise<MakeResult> => {
    inside += 1;
    mostInside = Math.max(mostInside, inside);
    await Promise.resolve();
    inside -= 1;
    calls.push(note.path);
    if (note.lines.length === 0) return "left";
    whileMaking(note);
    return makes(note);
  });
  const marked: string[] = [];
  const made = { hasMadeFor: (folder: string) => alreadyMade.includes(folder), markMadeFor: vi.fn(async (folder: string) => void marked.push(folder)) };
  const say = vi.fn();
  const items = { makeMissing: vi.fn(async () => ({ made: itemsMade, failed: itemsFailed })) };
  const files = { note: (path: string) => fileAt(path) };
  const backfill = new KindNoteBackfill({ store, files, keeper: { makeIfMissing }, items, made, say });
  return { backfill, calls, marked, say, made, makeIfMissing, items, store, hooks, mostInside: () => mostInside };
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
    const { backfill, say } = backfillWith([session(1, "? Who sent Mira")], [], () => "left");
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

  it("makes the item notes after the session notes, and says how many sessions and items got notes", async () => {
    const { backfill, say, items, calls } = backfillWith([session(1, "? Who sent Mira")], [], () => "made", 2);
    await backfill.run(CAMPAIGN);
    expect(items.makeMissing).toHaveBeenCalledOnce();
    expect(calls).toHaveLength(3);
    expect(say).toHaveBeenCalledExactlyOnceWith("Made notes for 1 session and 2 items.");
  });

  it("says only the items when no session got a note, in the singular for one", async () => {
    const { backfill, say } = backfillWith([session(1, "We rested.")], [], () => "made", 1);
    await backfill.run(CAMPAIGN);
    expect(say).toHaveBeenCalledExactlyOnceWith("Made notes for 1 item.");
  });

  it("makes no item note for a campaign it already made notes for", async () => {
    const { backfill, items } = backfillWith([session(1, "? Who sent Mira")], [CAMPAIGN], () => "made", 2);
    await backfill.run(CAMPAIGN);
    expect(items.makeMissing).not.toHaveBeenCalled();
  });

  it("doesn't mark the campaign done when a note couldn't be made, but still says what was made", async () => {
    const { backfill, marked, say } = backfillWith([session(1, "? Who sent Mira\n! Find the caravan")], [], (note) => {
      if (note.folder === "Quests") return "failed";
      return "made";
    });
    await backfill.run(CAMPAIGN);
    expect(marked).toEqual([]);
    expect(say).toHaveBeenCalledExactlyOnceWith("Made notes for 1 session.");
  });

  it("doesn't mark the campaign done when an item note couldn't be made", async () => {
    const { backfill, marked } = backfillWith([session(1, "We rested.")], [], () => "made", 1, 1);
    await backfill.run(CAMPAIGN);
    expect(marked).toEqual([]);
  });

  it("stops, makes no item note and doesn't mark the campaign done when another campaign is open by the next session", async () => {
    const { backfill, marked, hooks, store, items, calls } = backfillWith([session(1, "? Who sent Mira"), session(2, "? Who sent Baka")]);
    hooks.whileMaking = () => {
      store.campaignFolder = "D&D/Silver Road";
    };
    await backfill.run(CAMPAIGN);
    expect(calls.every((path) => path.endsWith("Session 1.md"))).toBe(true);
    expect(items.makeMissing).not.toHaveBeenCalled();
    expect(marked).toEqual([]);
  });

  it("doesn't mark the campaign done when it was closed after the last session", async () => {
    const { backfill, marked, hooks, store } = backfillWith([session(1, "? Who sent Mira")]);
    hooks.whileMaking = () => {
      store.campaignFolder = null;
    };
    await backfill.run(CAMPAIGN);
    expect(marked).toEqual([]);
  });

  it("does nothing while the campaign is still opening, or is no longer the one that was opened", async () => {
    const opening = backfillWith([session(1, "? Who sent Mira")]);
    opening.store.opening = true;
    await opening.backfill.run(CAMPAIGN);
    const other = backfillWith([session(1, "? Who sent Mira")]);
    await other.backfill.run("D&D/Silver Road");
    expect(opening.makeIfMissing).not.toHaveBeenCalled();
    expect(other.makeIfMissing).not.toHaveBeenCalled();
    expect(opening.marked).toEqual([]);
  });

  it("doesn't mark a campaign done that it saw no session of", async () => {
    const { backfill, marked, items } = backfillWith([]);
    await backfill.run(CAMPAIGN);
    expect(marked).toEqual([]);
    expect(items.makeMissing).not.toHaveBeenCalled();
  });

  it("doesn't mark the campaign done when it was closed while its item notes were made", async () => {
    const { backfill, marked, store, items } = backfillWith([session(1, "We rested.")]);
    items.makeMissing.mockImplementation(async () => {
      store.campaignFolder = null;
      return { made: 0, failed: 0 };
    });
    await backfill.run(CAMPAIGN);
    expect(marked).toEqual([]);
  });

  it("makes every note from the campaign it first saw, though the campaign the store holds changes as it goes", async () => {
    const { backfill, hooks, store, makeIfMissing } = backfillWith([session(1, "? Who sent Mira"), session(2, "? Who sent Baka")]);
    hooks.whileMaking = () => {
      store.current = buildCampaign([]);
    };
    await backfill.run(CAMPAIGN);
    const lines = makeIfMissing.mock.calls.filter(([note]) => note.folder === "Questions").map(([note]) => note.lines);
    expect(lines).toEqual([["? Who sent Mira"], ["? Who sent Baka"]]);
  });
});
