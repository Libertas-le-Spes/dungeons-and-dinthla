import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { CHANGED_IN_NOTE, LINES_LEFT, type EditorFiles } from "../../src/campaign/note-editor";
import { sessionNoteOf } from "../../src/campaign/session-file";
import { canCollectReward, CHANGES_ANOTHER_QUEST, initialQuestEdit, planQuestSave, refusalForQuestPlan, type QuestEdit } from "../../src/quests/quest-plan";
import { QuestWriter } from "../../src/quests/quest-writer";

class FakeNotes {
  readonly texts: Map<string, string>;
  writes = 0;

  constructor(notes: Record<string, string>) {
    this.texts = new Map(Object.entries(notes));
  }

  get vault(): EditorFiles {
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

  sessions() {
    return [...this.texts].map(([path, text]) => sessionNoteOf(path, Number(/(\d+)\.md$/.exec(path)![1]), text));
  }

  campaign() {
    return buildCampaign(this.sessions());
  }

  async save(index: number, changes: Partial<QuestEdit>, targetPath: string): Promise<boolean> {
    const campaign = this.campaign();
    const record = campaign.quests[index]!;
    const plan = planQuestSave(record, edit(changes), campaign.coins, targetPath);
    const refusal = refusalForQuestPlan(this.sessions(), record, plan);
    if (refusal !== null) throw new Error(refusal);
    return new QuestWriter(this.vault).apply(plan);
  }
}

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

function edit(changes: Partial<QuestEdit>): QuestEdit {
  return { status: "active", happened: "", collectReward: false, followUp: "", ...changes };
}

function session(number: number): string {
  return `Pale Moon/Sessions/Session ${number}.md`;
}

describe("saving a quest", () => {
  it("completes a quest with what happened, collecting its coin reward into the purse", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find the caravan, reward: 200 gp\n", [TWO]: "" });
    await notes.save(0, { status: "completed", happened: "under the mill", collectReward: true }, TWO);
    expect(notes.texts.get(TWO)).toBe("!= Find the caravan: under the mill\n$ +200 gp reward, for: Find the caravan\n");
    const campaign = notes.campaign();
    expect(campaign.quests[0]?.outcome).toMatchObject({ status: "completed", text: "under the mill" });
    expect(campaign.purseCopper).toBe(20000);
  });

  it("collects no reward unless asked, and writes none that isn't coin", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it, reward: 5 gp\n! Clear it, reward: a lantern\n" });
    await notes.save(0, { status: "completed" }, ONE);
    await notes.save(1, { status: "completed", collectReward: true }, ONE);
    expect(notes.texts.get(ONE)).toBe("! Find it, reward: 5 gp\n! Clear it, reward: a lantern\n!= Find it:\n!= Clear it:\n");
  });

  it("collects a reward once, even when the quest is reopened and completed again", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it, reward: 200 gp\n" });
    await notes.save(0, { status: "completed", collectReward: true }, ONE);
    await notes.save(0, { status: "active" }, ONE);
    await notes.save(0, { status: "completed", collectReward: true }, ONE);
    expect(notes.campaign().purseCopper).toBe(20000);
    expect(notes.texts.get(ONE)?.match(/reward, for:/g)).toHaveLength(1);
  });

  it("offers the reward to a quest completed after being abandoned", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it, reward: 5 gp\n!x Find it: gave up\n" });
    expect(canCollectReward(notes.campaign().quests[0]!, notes.campaign().coins)).toBe(true);
    await notes.save(0, { status: "completed", collectReward: true }, ONE);
    expect(notes.campaign().purseCopper).toBe(500);
  });

  it("doesn't offer a reward whose line would count money in the quest's title", () => {
    const notes = new FakeNotes({ [ONE]: "! Pay the 50 gp toll, reward: 200 gp\n! Find who paid 30 gp, reward: 100 gp\n" });
    const campaign = notes.campaign();
    expect(campaign.quests.map((record) => canCollectReward(record, campaign.coins))).toEqual([false, false]);
  });

  it("abandons a quest with what happened", async () => {
    const notes = new FakeNotes({ [ONE]: "! Guard the bridge\n" });
    await notes.save(0, { status: "failed", happened: "it burned" }, ONE);
    expect(notes.texts.get(ONE)).toBe("! Guard the bridge\n!x Guard the bridge: it burned\n");
  });

  it("notes progress on an active quest, and opens a follow-up quest in the same step", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n" });
    await notes.save(0, { happened: "tracks", followUp: "Escort [[Mira]]" }, ONE);
    expect(notes.texts.get(ONE)).toBe("! Find it\n!+ Find it: tracks\n! Escort [[Mira]], after: Find it\n");
  });

  it("sets a finished quest active again by removing its outcome line", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n!= Find it: done\n" });
    await notes.save(0, { status: "active" }, ONE);
    expect(notes.texts.get(ONE)).toBe("! Find it\n");
  });

  it("replaces a changed outcome without collecting the reward a second time", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it, reward: 5 gp\n!= Find it: done\n$ +5 gp reward, for: Find it\n", [TWO]: "" });
    await notes.save(0, { status: "completed", happened: "done late", collectReward: true }, TWO);
    expect(notes.texts.get(ONE)).toBe("! Find it, reward: 5 gp\n$ +5 gp reward, for: Find it\n!= Find it: done late\n");
    expect(notes.texts.get(TWO)).toBe("");
    expect(notes.campaign().purseCopper).toBe(500);
  });

  it("writes nothing when nothing changed", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n!= Find it: done\n" });
    expect(await notes.save(0, { status: "completed", happened: " done " }, ONE)).toBe(false);
    expect(notes.writes).toBe(0);
  });

  it("refuses to replace an outcome edited by hand", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n!= Find it: done\n" });
    const campaign = notes.campaign();
    const plan = planQuestSave(campaign.quests[0]!, edit({ status: "active" }), campaign.coins, ONE);
    notes.texts.set(ONE, "! Find it\n!= Find it: done, mostly\n");
    await expect(new QuestWriter(notes.vault).apply(plan)).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(ONE)).toBe("! Find it\n!= Find it: done, mostly\n");
  });

  it("refuses rather than replace a twin of an outcome edited by hand", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n!= Find it: done\n" });
    const campaign = notes.campaign();
    const plan = planQuestSave(campaign.quests[0]!, edit({ status: "active" }), campaign.coins, ONE);
    const handEdited = "! Find it\n!= Find it: done, mostly\n!= Find it: done\n";
    notes.texts.set(ONE, handEdited);
    await expect(new QuestWriter(notes.vault).apply(plan)).rejects.toThrow(CHANGED_IN_NOTE);
    expect(notes.texts.get(ONE)).toBe(handEdited);
  });
});

describe("refusing a quest change that would change another quest", () => {
  it("refuses reopening a quest that would take a later same-titled quest's progress", async () => {
    const notes = new FakeNotes({
      [session(1)]: "! Deliver the letter\n",
      [session(2)]: "!= Deliver the letter: delivered\n",
      [session(3)]: "! Deliver the letter\n",
      [session(4)]: "!+ Deliver the letter: on the road\n",
    });
    await expect(notes.save(0, { status: "active" }, session(4))).rejects.toThrow(CHANGES_ANOTHER_QUEST);
    expect(notes.writes).toBe(0);
  });

  it("refuses an outcome written into an earlier session that a same-titled quest would take", async () => {
    const notes = new FakeNotes({
      [session(1)]: "! Deliver the letter\n",
      [session(2)]: "! Deliver the letter\n",
      [session(3)]: "",
      [session(5)]: "!= Deliver the letter: delivered\n",
    });
    await expect(notes.save(1, { status: "completed", happened: "by hand" }, session(3))).rejects.toThrow(CHANGES_ANOTHER_QUEST);
  });

  it("refuses an outcome that a quest whose title starts the same way would take", async () => {
    const notes = new FakeNotes({
      [session(1)]: "! Ring\n! Ring: lost\n",
      [session(3)]: "",
      [session(5)]: "!= Ring: lost: found\n",
    });
    await expect(notes.save(0, { status: "completed", happened: "lost: in the well" }, session(3))).rejects.toThrow(CHANGES_ANOTHER_QUEST);
  });
});

describe("refusing changes that swap same-titled quests in one note", () => {
  it("refuses reopening a quest that would take a later same-titled quest's progress in the same note", async () => {
    const notes = new FakeNotes({ [ONE]: "! X, reward: 5 gp\n!= X: done\n! X, reward: 100 gp\n!+ X: a\n" });
    await expect(notes.save(0, { status: "active" }, ONE)).rejects.toThrow(CHANGES_ANOTHER_QUEST);
  });

  it("refuses reopening a quest that would take a later same-titled quest's outcome in the same note", async () => {
    const notes = new FakeNotes({ [ONE]: "! X, reward: 5 gp\n!= X: done\n! X, reward: 100 gp\n!x X: lost\n" });
    await expect(notes.save(0, { status: "active" }, ONE)).rejects.toThrow(CHANGES_ANOTHER_QUEST);
  });

  it("lets one of two identical finished quests change on its own", async () => {
    const notes = new FakeNotes({ [ONE]: "! X\n!= X: done\n! X\n!= X: done\n" });
    await notes.save(1, { status: "failed", happened: "done" }, ONE);
    expect(notes.campaign().quests.map((record) => record.outcome?.status)).toEqual(["completed", "failed"]);
  });

  it("refuses a plan that would move the purse by more than the reward", () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n" });
    const campaign = notes.campaign();
    const plan = planQuestSave(campaign.quests[0]!, edit({ happened: "tracks" }), campaign.coins, ONE);
    expect(refusalForQuestPlan(notes.sessions(), campaign.quests[0]!, { ...plan, added: [...plan.added, "$ 5 gp found"] })).toBe(
      CHANGES_ANOTHER_QUEST,
    );
  });
});

describe("the reward and outcome rules for recurring quests", () => {
  it("offers a reward only when it reads as one amount", () => {
    const notes = new FakeNotes({ [ONE]: "! Escort, reward: 100 gp or 2 pp\n! Guard, reward: 100 gp\n" });
    const campaign = notes.campaign();
    expect(campaign.quests.map((record) => canCollectReward(record, campaign.coins))).toEqual([false, true]);
  });

  it("corrects an old outcome in its own note, so a later quest of the same title keeps its progress", async () => {
    const notes = new FakeNotes({ [ONE]: "! Clear the rats\n!= Clear the rats: done\n", [TWO]: "! Clear the rats\n!+ Clear the rats: cellar\n" });
    await notes.save(0, { status: "failed", happened: "fled" }, TWO);
    expect(notes.texts.get(ONE)).toBe("! Clear the rats\n!x Clear the rats: fled\n");
    expect(notes.campaign().quests.map((record) => [record.outcome?.status, record.progress.map((note) => note.text)])).toEqual([
      ["failed", []],
      [undefined, ["cellar"]],
    ]);
  });

  it("refuses a follow-up quest that a stray line would mark finished at once", async () => {
    const notes = new FakeNotes({ [session(1)]: "! T\n", [session(2)]: "", [session(3)]: "!= Return it, after: T: done\n" });
    await expect(notes.save(0, { followUp: "Return it" }, session(2))).rejects.toThrow(CHANGES_ANOTHER_QUEST);
  });

  it("starts the reward toggle on for an active quest and off for a finished one", () => {
    const notes = new FakeNotes({ [ONE]: "! A, reward: 5 gp\n! B, reward: 5 gp\n!= B: done\n" });
    expect(notes.campaign().quests.map((record) => initialQuestEdit(record))).toEqual([
      { status: "active", happened: "", collectReward: true, followUp: "" },
      { status: "completed", happened: "done", collectReward: false, followUp: "" },
    ]);
  });
});

describe("refusing a quest change that swaps lines with a quest starting the same way", () => {
  it("refuses an outcome that would swap outcome lines with another quest", async () => {
    const notes = new FakeNotes({ [session(1)]: "! Ring: lost\n! Ring\n", [session(2)]: "", [session(3)]: "!= Ring: lost: found\n" });
    await expect(notes.save(1, { status: "completed", happened: "lost: found" }, session(2))).rejects.toThrow(CHANGES_ANOTHER_QUEST);
  });

  it("sets a finished quest active with progress across notes, writing the progress where you are", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n!= Find it: done\n", [TWO]: "" });
    await notes.save(0, { status: "active", happened: "not done after all" }, TWO);
    expect(notes.texts.get(ONE)).toBe("! Find it\n");
    expect(notes.texts.get(TWO)).toBe("!+ Find it: not done after all\n");
  });
});

describe("adding a quest", () => {
  it("adds the new quest's line to the session", async () => {
    const notes = new FakeNotes({ [ONE]: "We rode on.\n" });
    expect(await new QuestWriter(notes.vault).add("! Escort Mira, reward: 50 gp", ONE)).toBe(true);
    expect(notes.campaign().quests.map((record) => [record.quest.title, record.quest.reward])).toEqual([["Escort Mira", "50 gp"]]);
  });
});

describe("deleting a quest", () => {
  it("removes it with its progress and outcome, wherever they were written", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it, from: [[Lady Vess]]\n!+ Find it: tracks\n! Keep this\n", [TWO]: "!= Find it: done\n" });
    await new QuestWriter(notes.vault).delete(notes.campaign().quests[0]!);
    expect(notes.texts.get(ONE)).toBe("! Keep this\n");
    expect(notes.texts.get(TWO)).toBe("");
  });

  it("deletes only the opened quest when another line reads the same", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n!= Find it: done\n! Find it\n" });
    await new QuestWriter(notes.vault).delete(notes.campaign().quests[1]!);
    expect(notes.texts.get(ONE)).toBe("! Find it\n!= Find it: done\n");
  });

  it("says so when its progress or outcome moved since they were read, leaving them", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n!+ Find it: tracks\n!= Find it: done\n" });
    const record = notes.campaign().quests[0]!;
    notes.texts.set(ONE, "! Find it\nmid\n!+ Find it: tracks\n!= Find it: done\n");
    await expect(new QuestWriter(notes.vault).delete(record)).rejects.toThrow(`${LINES_LEFT} ${ONE}.`);
    expect(notes.texts.get(ONE)).toBe("mid\n!+ Find it: tracks\n!= Find it: done\n");
  });
});
