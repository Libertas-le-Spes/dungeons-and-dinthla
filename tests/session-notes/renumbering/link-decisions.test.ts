import { describe, expect, it } from "vitest";
import { LinkDecider, type DecisionPlan, type NoteDecision } from "../../../src/session-notes/renumbering/link-decisions";
import type { SessionRename } from "../../../src/session-notes/renumbering/renumbering-plan";
import { FakeCampaignFiles } from "./fake-campaign-files";
import { STUB_SYNTAX } from "../../host/stub-syntax";

const PALE = "D&D/Pale Moon";
const ASHEN = "D&D/Ashen Road";
const MIRA = `${PALE}/Characters/Mira.md`;
const IDEAS = "D&D/Ideas.md";
const ASH_NOTE = `${ASHEN}/Characters/Ash.md`;

function session(campaign: string, number: number): string {
  return `${campaign}/Sessions/Session ${number}.md`;
}

function rename(from: number, to: number): SessionRename {
  return { from: session(PALE, from), to: session(PALE, to), fromNumber: from, toNumber: to };
}

function campaignFiles(notes: Record<string, string>): FakeCampaignFiles {
  const sessions: Record<string, string> = {};
  for (const number of [1, 4, 5]) sessions[session(PALE, number)] = "";
  for (const number of [1, 4]) sessions[session(ASHEN, number)] = "";
  return new FakeCampaignFiles({ ...sessions, ...notes });
}

function planFor(notes: string[]): DecisionPlan {
  return { campaignFolder: PALE, campaignFolders: [PALE, ASHEN], notes, renames: [rename(4, 2), rename(5, 3)] };
}

function firstOf(notes: NoteDecision[]): NoteDecision {
  const [first] = notes;
  if (first === undefined) throw new Error("No note was decided.");
  return first;
}

async function decided(files: FakeCampaignFiles, notes: string[]) {
  return new LinkDecider(files, STUB_SYNTAX).decide(planFor(notes));
}

describe("LinkDecider", () => {
  it("decides a note's links to sessions that move, in the campaign's own reading", async () => {
    const files = campaignFiles({ [MIRA]: "Met [[Session 4]] and [[Session 1]].\n" });
    const { notes } = await decided(files, [MIRA]);
    expect(notes).toHaveLength(1);
    expect(firstOf(notes).changes).toBe(true);
    expect(firstOf(notes).newTarget("Session 4")).toBe("Session 2");
    expect(firstOf(notes).newTarget("Session 1")).toBeNull();
  });

  it("decides nothing for a note with no link to a session that moves", async () => {
    const files = campaignFiles({ [MIRA]: "Met [[Session 1]] and [[Mira]].\n" });
    const { notes } = await decided(files, [MIRA]);
    expect(firstOf(notes).changes).toBe(false);
  });

  it("reads a note of another campaign in that campaign only, so its Session 4 is its own", async () => {
    const files = campaignFiles({ [ASH_NOTE]: "See [[Session 4]].\n" });
    const { notes } = await decided(files, [ASH_NOTE]);
    expect(firstOf(notes).changes).toBe(false);
    expect(firstOf(notes).leftAsWritten).toBe(false);
  });

  it("reads a note outside every campaign in all of them, leaving a link two campaigns could mean", async () => {
    const files = campaignFiles({ [IDEAS]: "Try [[Session 4]] and [[Session 5]].\n" });
    const { notes } = await decided(files, [IDEAS]);
    expect(firstOf(notes).leftAsWritten).toBe(true);
    expect(firstOf(notes).newTarget("Session 4")).toBeNull();
    expect(firstOf(notes).newTarget("Session 5")).toBe("Session 3");
  });

  it("says when a link to a session that moves sits on a line that isn't rewritten", async () => {
    const files = campaignFiles({ [MIRA]: "Met [[Session 4]] %%aside%%\n" });
    const { notes } = await decided(files, [MIRA]);
    expect(firstOf(notes).skipped).toBe(true);
    expect(firstOf(notes).changes).toBe(false);
  });

  it("says a note was moved or deleted, and goes on with the others, when it isn't there", async () => {
    const files = campaignFiles({ [MIRA]: "Met [[Session 4]].\n" });
    const { notes, unread } = await decided(files, [`${PALE}/Characters/Gone.md`, MIRA]);
    expect(unread).toEqual([`${PALE}/Characters/Gone.md (${PALE}/Characters/Gone.md was moved or deleted)`]);
    expect(notes.map((note) => note.path)).toEqual([MIRA]);
  });

  it("says why a note couldn't be read, and goes on with the others", async () => {
    const files = campaignFiles({ [MIRA]: "Met [[Session 4]].\n", [`${PALE}/Characters/Vess.md`]: "" });
    files.failReadOf(MIRA, "the disk is gone.");
    const { notes, unread } = await decided(files, [MIRA, `${PALE}/Characters/Vess.md`]);
    expect(unread).toEqual([`${MIRA} (the disk is gone.)`]);
    expect(notes.map((note) => note.path)).toEqual([`${PALE}/Characters/Vess.md`]);
  });
});
