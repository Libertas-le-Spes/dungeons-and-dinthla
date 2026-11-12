import { describe, expect, it } from "vitest";
import { nameTakenWords, type RenumberingPlan } from "../../../src/session-notes/renumbering/renumbering-plan";
import { NOT_IN_A_CAMPAIGN, SESSIONS_CHANGED_SINCE_ASKED } from "../../../src/session-notes/renumbering/renumbering-words";
import { SessionRenumbering } from "../../../src/session-notes/renumbering/session-renumbering";
import { FakeCampaignFiles } from "./fake-campaign-files";

const PALE = "D&D/Pale Moon";
const ASHEN = "D&D/Ashen Road";
const MIRA = `${PALE}/Characters/Mira.md`;
const IDEAS = "D&D/Ideas.md";

function pale(number: number | string): string {
  return `${PALE}/Sessions/Session ${number}.md`;
}

function ashen(number: number): string {
  return `${ASHEN}/Sessions/Session ${number}.md`;
}

function campaigns(): string[] {
  return [PALE, ASHEN];
}

function campaignFiles(extra: Record<string, string> = {}): FakeCampaignFiles {
  return new FakeCampaignFiles({
    [`${PALE}/Pale Moon.md`]: "Pale Moon",
    [`${ASHEN}/Ashen Road.md`]: "Ashen Road",
    [pale(1)]: "One\n",
    [pale(2)]: "Two, see [[Session 1]] and [[Session 5]]\n",
    [pale(4)]: "Four\n",
    [pale(5)]: "Five, after [[Session 4]]\n",
    [pale(7)]: "Seven, after [[Session 5|the mill]] and [[Session 2]]\n",
    [ashen(1)]: "Ash one\n",
    [ashen(2)]: "Ash two, see [[Session 4]]\n",
    [ashen(4)]: "Ash four\n",
    ...extra,
  });
}

function planned(renumbering: SessionRenumbering, deleted: string): RenumberingPlan {
  const plan = renumbering.planFor(deleted);
  if ("error" in plan) throw new Error(plan.error);
  return plan;
}

async function renumberedAfterDeleting(files: FakeCampaignFiles, deleted: string) {
  const renumbering = new SessionRenumbering(files, campaigns);
  const plan = planned(renumbering, deleted);
  files.removeNote(deleted);
  const report = await renumbering.carryOut(plan);
  return { plan, report };
}

describe("SessionRenumbering.planFor", () => {
  it("plans how the campaign's sessions are numbered again once the session is deleted", () => {
    const plan = planned(new SessionRenumbering(campaignFiles(), campaigns), pale(2));
    expect(plan.renames.map((rename) => [rename.from, rename.to])).toEqual([
      [pale(4), pale(2)],
      [pale(5), pale(3)],
      [pale(7), pale(4)],
    ]);
    expect(plan.latest).toBe(pale(4));
  });

  it("looks only at the sessions of the campaign the session is in", () => {
    const plan = planned(new SessionRenumbering(campaignFiles(), campaigns), ashen(1));
    expect(plan.renames.map((rename) => [rename.from, rename.to])).toEqual([
      [ashen(2), ashen(1)],
      [ashen(4), ashen(2)],
    ]);
  });

  it("refuses when two sessions share a number", () => {
    const files = campaignFiles({ [pale("04")]: "Again" });
    expect(new SessionRenumbering(files, campaigns).planFor(pale(1))).toHaveProperty("error");
  });

  it("refuses, naming the file, when a new name is taken", () => {
    const files = campaignFiles({ [`${PALE}/Sessions/session 3.md`]: "Taken" });
    expect(new SessionRenumbering(files, campaigns).planFor(pale(2))).toEqual({ error: nameTakenWords(pale(3)) });
  });

  it("refuses when the session isn't in a campaign", () => {
    expect(new SessionRenumbering(campaignFiles(), campaigns).planFor("D&D/Sessions/Session 1.md")).toEqual({ error: NOT_IN_A_CAMPAIGN });
  });
});

describe("SessionRenumbering.confirmed", () => {
  it("gives the plan again when nothing changed since it was asked", () => {
    const renumbering = new SessionRenumbering(campaignFiles(), campaigns);
    const asked = planned(renumbering, pale(2));
    expect(renumbering.confirmed(pale(2), asked)).toEqual(asked);
  });

  it("refuses when the sessions changed since it was asked", () => {
    const files = campaignFiles();
    const renumbering = new SessionRenumbering(files, campaigns);
    const asked = planned(renumbering, pale(2));
    files.addNote(pale(9), "Nine");
    expect(() => renumbering.confirmed(pale(2), asked)).toThrow(SESSIONS_CHANGED_SINCE_ASKED);
  });

  it("refuses with the plan's words when the sessions can no longer be numbered again", () => {
    const files = campaignFiles();
    const renumbering = new SessionRenumbering(files, campaigns);
    const asked = planned(renumbering, pale(2));
    files.addNote(`${PALE}/Sessions/session 3.md`, "Taken");
    expect(() => renumbering.confirmed(pale(2), asked)).toThrow(nameTakenWords(pale(3)));
  });
});

describe("SessionRenumbering.carryOut", () => {
  it("renames the sessions lowest first and keeps their notes", async () => {
    const files = campaignFiles();
    await renumberedAfterDeleting(files, pale(2));
    expect(files.renames).toEqual([
      [pale(4), pale(2)],
      [pale(5), pale(3)],
      [pale(7), pale(4)],
    ]);
    expect(files.textAt(pale(2))).toBe("Four\n");
  });

  it("rewrites links in the campaign's notes to the sessions that moved, leaving links to others and to the deleted session", async () => {
    const files = campaignFiles({ [MIRA]: "Met [[Session 4]], then [[Session 1]], then [[Session 2]].\n" });
    await renumberedAfterDeleting(files, pale(2));
    expect(files.textAt(MIRA)).toBe("Met [[Session 2]], then [[Session 1]], then [[Session 2]].\n");
    expect(files.textAt(pale(3))).toBe("Five, after [[Session 2]]\n");
    expect(files.textAt(pale(4))).toBe("Seven, after [[Session 3|the mill]] and [[Session 2]]\n");
  });

  it("changes each link once, so one move never carries on into the next", async () => {
    const notes = { [pale(1)]: "", [pale(2)]: "", [pale(3)]: "", [pale(4)]: "", [pale(5)]: "", [MIRA]: "[[Session 3]] [[Session 4]] [[Session 5]]\n", [`${PALE}/Pale Moon.md`]: "" };
    const files = new FakeCampaignFiles(notes);
    await renumberedAfterDeleting(files, pale(2));
    expect(files.textAt(MIRA)).toBe("[[Session 2]] [[Session 3]] [[Session 4]]\n");
  });

  it("rewrites a link in a note of the Campaigns folder outside any campaign when only the renumbered campaign has that session", async () => {
    const files = campaignFiles({ [IDEAS]: "Try [[Session 7]] and [[Session 5]].\n" });
    const { report } = await renumberedAfterDeleting(files, pale(2));
    expect(files.textAt(IDEAS)).toBe("Try [[Session 4]] and [[Session 3]].\n");
    expect(report.linksLeft).toEqual([]);
  });

  it("leaves a link in a note outside any campaign when another campaign has that session too, and says which note", async () => {
    const files = campaignFiles({ [IDEAS]: "Try [[Session 4]] and [[Session 5]].\n" });
    const { report } = await renumberedAfterDeleting(files, pale(2));
    expect(files.textAt(IDEAS)).toBe("Try [[Session 4]] and [[Session 3]].\n");
    expect(report.linksLeft).toEqual([IDEAS]);
  });

  it("says which notes still hold a link to a session that moved on a line it doesn't rewrite", async () => {
    const files = campaignFiles({
      [MIRA]: "Met [[Session 4]] %%aside%%\n",
      [`${PALE}/Characters/Brother Aldric.md`]: "---\nfrom: \"[[Session 4]]\"\n---\nBody.\n",
      [`${PALE}/Characters/Lady Vess.md`]: "Plans:\n\n    - see [[Session 4]]\n",
      [`${PALE}/Characters/Thessaly.md`]: "```\n[[Session 4]]\n```\n[[Session 1]] %%x%%\n",
    });
    const { report } = await renumberedAfterDeleting(files, pale(2));
    expect(report.linksSkipped.sort()).toEqual([MIRA, `${PALE}/Characters/Brother Aldric.md`, `${PALE}/Characters/Lady Vess.md`, `${PALE}/Characters/Thessaly.md`].sort());
    expect(files.textAt(MIRA)).toBe("Met [[Session 4]] %%aside%%\n");
  });

  it("doesn't say a note still holds a link on a skipped line when that link is to a session that doesn't move", async () => {
    const files = campaignFiles({ [MIRA]: "Met [[Session 1]] %%aside%%\n" });
    const { report } = await renumberedAfterDeleting(files, pale(2));
    expect(report.linksSkipped).toEqual([]);
  });

  it("leaves another campaign's notes alone", async () => {
    const files = campaignFiles();
    const { report } = await renumberedAfterDeleting(files, pale(2));
    expect(files.textAt(ashen(2))).toBe("Ash two, see [[Session 4]]\n");
    expect(files.written).not.toContain(ashen(2));
    expect(report.linksLeft).toEqual([]);
  });

  it("writes only the notes whose links changed", async () => {
    const files = campaignFiles({ [MIRA]: "Met nobody.\n" });
    await renumberedAfterDeleting(files, pale(2));
    expect(files.written.sort()).toEqual([pale(3), pale(4)].sort());
  });

  it("reports nothing wrong when it all went through", async () => {
    const { report } = await renumberedAfterDeleting(campaignFiles(), pale(2));
    expect(report).toEqual({ renamed: expect.any(Array), notRenamed: [], renameFailure: null, linksNotUpdated: [], linksLeft: [], linksSkipped: [] });
    expect(report.renamed).toHaveLength(3);
  });

  it("stops at a rename that fails, updates no link and says which sessions were renamed and which weren't", async () => {
    const files = campaignFiles({ [MIRA]: "Met [[Session 4]].\n" });
    files.failRenameOf(pale(5), "the disk is full.");
    const { report } = await renumberedAfterDeleting(files, pale(2));
    expect(report.renamed.map((rename) => rename.fromNumber)).toEqual([4]);
    expect(report.notRenamed.map((rename) => rename.fromNumber)).toEqual([5, 7]);
    expect(report.renameFailure).toBe("the disk is full.");
    expect(report.linksNotUpdated).toEqual([]);
    expect(files.written).toEqual([]);
    expect(files.textAt(MIRA)).toBe("Met [[Session 4]].\n");
  });

  it("goes on with the other notes when one note's links can't be updated, and says which", async () => {
    const files = campaignFiles({ [MIRA]: "Met [[Session 4]].\n" });
    files.failChangeOf(MIRA, "the disk is full.");
    const { report } = await renumberedAfterDeleting(files, pale(2));
    expect(report.linksNotUpdated).toEqual([`${MIRA} (the disk is full.)`]);
    expect(files.textAt(MIRA)).toBe("Met [[Session 4]].\n");
    expect(files.textAt(pale(3))).toBe("Five, after [[Session 2]]\n");
  });

  it("goes on with the other notes when one note can't be read before the sessions are renamed, and says which", async () => {
    const files = campaignFiles({ [MIRA]: "Met [[Session 4]].\n" });
    files.failReadOf(MIRA, "the disk is gone.");
    const { report } = await renumberedAfterDeleting(files, pale(2));
    expect(report.linksNotUpdated).toEqual([`${MIRA} (the disk is gone.)`]);
    expect(files.textAt(MIRA)).toBe("Met [[Session 4]].\n");
    expect(files.textAt(pale(3))).toBe("Five, after [[Session 2]]\n");
  });

  it("renames nothing and writes nothing when no session moves", async () => {
    const files = new FakeCampaignFiles({ [`${PALE}/Pale Moon.md`]: "", [pale(1)]: "", [pale(2)]: "[[Session 1]]\n" });
    await renumberedAfterDeleting(files, pale(2));
    expect(files.rename).not.toHaveBeenCalled();
    expect(files.process).not.toHaveBeenCalled();
  });
});
