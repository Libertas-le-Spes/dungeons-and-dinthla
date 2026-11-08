import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { CHANGED_IN_NOTE, type EditorVault } from "../../src/campaign/note-editor";
import { sessionNoteOf } from "../../src/campaign/session-file";
import { QuestWriter, type QuestEdit } from "../../src/quests/quest-writer";

class FakeNotes {
  readonly texts: Map<string, string>;
  writes = 0;

  constructor(notes: Record<string, string>) {
    this.texts = new Map(Object.entries(notes));
  }

  get vault(): EditorVault {
    return {
      getFileByPath: (path) => {
        if (!this.texts.has(path)) return null;
        return { path } as TFile;
      },
      process: async (file, change) => {
        this.writes += 1;
        const next = change(this.texts.get(file.path)!);
        this.texts.set(file.path, next);
        return next;
      },
      read: async (file) => this.texts.get(file.path)!,
    };
  }

  campaign() {
    const sessions = [...this.texts].map(([path, text]) => sessionNoteOf(path, Number(/(\d+)\.md$/.exec(path)![1]), text));
    return buildCampaign(sessions);
  }
}

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

function edit(changes: Partial<QuestEdit>): QuestEdit {
  return { status: "active", happened: "", collectReward: false, followUp: "", ...changes };
}

describe("QuestWriter", () => {
  it("completes a quest with what happened, collecting its coin reward into the purse", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find the caravan, reward: 200 gp\n", [TWO]: "" });
    const [record] = notes.campaign().quests;
    await new QuestWriter(notes.vault).save(record!, edit({ status: "completed", happened: "under the mill", collectReward: true }), TWO);
    expect(notes.texts.get(TWO)).toBe("!= Find the caravan: under the mill\n$ +200 gp reward, for: Find the caravan\n");
    const campaign = notes.campaign();
    expect(campaign.quests[0]?.outcome).toMatchObject({ status: "completed", text: "under the mill" });
    expect(campaign.purseCopper).toBe(20000);
  });

  it("collects no reward unless asked, and none that isn't coin", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it, reward: 5 gp\n! Clear it, reward: a lantern\n" });
    const [find, clear] = notes.campaign().quests;
    const writer = new QuestWriter(notes.vault);
    await writer.save(find!, edit({ status: "completed" }), ONE);
    await writer.save(clear!, edit({ status: "completed", collectReward: true }), ONE);
    expect(notes.campaign().coins).toEqual([]);
  });

  it("abandons a quest with what happened", async () => {
    const notes = new FakeNotes({ [ONE]: "! Guard the bridge\n" });
    await new QuestWriter(notes.vault).save(notes.campaign().quests[0]!, edit({ status: "failed", happened: "it burned" }), ONE);
    expect(notes.texts.get(ONE)).toBe("! Guard the bridge\n!x Guard the bridge: it burned\n");
  });

  it("notes progress on an active quest, and opens a follow-up quest in the same step", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n" });
    await new QuestWriter(notes.vault).save(notes.campaign().quests[0]!, edit({ happened: "tracks", followUp: "Escort [[Mira]]" }), ONE);
    expect(notes.texts.get(ONE)).toBe("! Find it\n!+ Find it: tracks\n! Escort [[Mira]], after: Find it\n");
  });

  it("sets a finished quest active again by removing its outcome line", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n!= Find it: done\n" });
    await new QuestWriter(notes.vault).save(notes.campaign().quests[0]!, edit({ status: "active" }), ONE);
    expect(notes.texts.get(ONE)).toBe("! Find it\n");
    expect(notes.campaign().quests[0]?.outcome).toBeNull();
  });

  it("replaces a changed outcome, and doesn't collect the reward again", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it, reward: 5 gp\n!= Find it: done\n", [TWO]: "" });
    await new QuestWriter(notes.vault).save(notes.campaign().quests[0]!, edit({ status: "failed", happened: "lost it", collectReward: true }), TWO);
    expect(notes.texts.get(ONE)).toBe("! Find it, reward: 5 gp\n");
    expect(notes.texts.get(TWO)).toBe("!x Find it: lost it\n");
  });

  it("writes nothing when nothing changed", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n!= Find it: done\n" });
    expect(await new QuestWriter(notes.vault).save(notes.campaign().quests[0]!, edit({ status: "completed", happened: " done " }), ONE)).toBe(false);
    expect(notes.writes).toBe(0);
  });

  it("refuses to replace an outcome edited by hand", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n!= Find it: done\n" });
    const [record] = notes.campaign().quests;
    notes.texts.set(ONE, "! Find it\n!= Find it: done, mostly\n");
    await expect(new QuestWriter(notes.vault).save(record!, edit({ status: "active" }), ONE)).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(ONE)).toBe("! Find it\n!= Find it: done, mostly\n");
  });

  it("deletes a quest with its progress and outcome, wherever they were written", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it, from: [[Lady Vess]]\n!+ Find it: tracks\n! Keep this\n", [TWO]: "!= Find it: done\n" });
    await new QuestWriter(notes.vault).delete(notes.campaign().quests[0]!);
    expect(notes.texts.get(ONE)).toBe("! Keep this\n");
    expect(notes.texts.get(TWO)).toBe("");
  });

  it("knows when a quest's reward can be collected", () => {
    const notes = new FakeNotes({ [ONE]: "! A, reward: 5 gp\n! B, reward: a horse\n! C, reward: 5 gp\n!= C: done\n" });
    expect(notes.campaign().quests.map((record) => QuestWriter.canCollectReward(record))).toEqual([true, false, false]);
  });
});
