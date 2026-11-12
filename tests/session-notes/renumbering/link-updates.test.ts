import { describe, expect, it } from "vitest";
import { DecidedTargets } from "../../../src/session-notes/renumbering/decided-targets";
import type { Decisions, NoteDecision } from "../../../src/session-notes/renumbering/link-decisions";
import { LinkUpdates } from "../../../src/session-notes/renumbering/link-updates";
import type { SessionRename } from "../../../src/session-notes/renumbering/renumbering-plan";
import { FakeCampaignFiles } from "./fake-campaign-files";

const NOTE = "Pale Moon/Characters/Mira.md";
const OTHER = "Pale Moon/Characters/Vess.md";

function decisionFor(path: string, changes: Record<string, string | null>, extra: Partial<NoteDecision> = {}): NoteDecision {
  const targets = new DecidedTargets();
  for (const [target, replacement] of Object.entries(changes)) targets.record(target, replacement);
  return { path, changes: targets.hasChange(), leftAsWritten: false, skipped: false, newTarget: targets.newTarget, ...extra };
}

function decisions(notes: NoteDecision[], unread: string[] = []): Decisions {
  return { notes, unread };
}

describe("LinkUpdates", () => {
  it("writes the links the decisions give for a note that has changes", async () => {
    const files = new FakeCampaignFiles({ [NOTE]: "Met [[Session 4]].\n" });
    const report = await new LinkUpdates(files).apply(decisions([decisionFor(NOTE, { "Session 4": "Session 2" })]), []);
    expect(files.textAt(NOTE)).toBe("Met [[Session 2]].\n");
    expect(report).toEqual({ notUpdated: [], leftAsWritten: [], skipped: [] });
  });

  it("writes nothing for a note with no change decided", async () => {
    const files = new FakeCampaignFiles({ [NOTE]: "Met [[Session 4]].\n" });
    await new LinkUpdates(files).apply(decisions([decisionFor(NOTE, { "Session 4": null })]), []);
    expect(files.process).not.toHaveBeenCalled();
  });

  it("leaves a link the note gained after the decisions were made as written", async () => {
    const files = new FakeCampaignFiles({ [NOTE]: "Met [[Session 4]] and [[Session 5]].\n" });
    await new LinkUpdates(files).apply(decisions([decisionFor(NOTE, { "Session 4": "Session 2" })]), []);
    expect(files.textAt(NOTE)).toBe("Met [[Session 2]] and [[Session 5]].\n");
  });

  it("writes a note that was renamed at the name it has now", async () => {
    const files = new FakeCampaignFiles({ "Pale Moon/Sessions/Session 2.md": "See [[Session 4]].\n" });
    const moved: SessionRename = { from: "Pale Moon/Sessions/Session 5.md", to: "Pale Moon/Sessions/Session 2.md", fromNumber: 5, toNumber: 2 };
    const report = await new LinkUpdates(files).apply(decisions([decisionFor(moved.from, { "Session 4": "Session 1" })]), [moved]);
    expect(files.textAt(moved.to)).toBe("See [[Session 1]].\n");
    expect(report.notUpdated).toEqual([]);
  });

  it("says why a note couldn't be written, and goes on with the others", async () => {
    const files = new FakeCampaignFiles({ [NOTE]: "Met [[Session 4]].\n", [OTHER]: "Met [[Session 4]].\n" });
    files.failChangeOf(NOTE, "the disk is full.");
    const both = [decisionFor(NOTE, { "Session 4": "Session 2" }), decisionFor(OTHER, { "Session 4": "Session 2" })];
    const report = await new LinkUpdates(files).apply(decisions(both), []);
    expect(report.notUpdated).toEqual([`${NOTE} (the disk is full.)`]);
    expect(files.textAt(OTHER)).toBe("Met [[Session 2]].\n");
  });

  it("carries the notes that couldn't be read, and says which notes were left as written or skipped", async () => {
    const files = new FakeCampaignFiles({ [NOTE]: "x\n", [OTHER]: "y\n" });
    const notes = [decisionFor(NOTE, {}, { leftAsWritten: true }), decisionFor(OTHER, {}, { skipped: true })];
    const report = await new LinkUpdates(files).apply(decisions(notes, ["Pale Moon/Gone.md (it was gone)"]), []);
    expect(report).toEqual({ notUpdated: ["Pale Moon/Gone.md (it was gone)"], leftAsWritten: [NOTE], skipped: [OTHER] });
  });
});
