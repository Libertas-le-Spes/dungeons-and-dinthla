import { describe, expect, it } from "vitest";
import type { TFile } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { Campaign, QuestRecord, SessionNote } from "../../src/campaign/campaign";
import type { EditorFiles } from "../../src/campaign/note-editor";
import { SessionChangeWriter } from "../../src/campaign/session-change-writer";
import { sessionNoteOf } from "../../src/campaign/session-file";
import { writeRecordChange } from "../../src/campaign/write-record-change";
import { GOES_ELSEWHERE } from "../../src/quests/current-quest";
import { questSave } from "../../src/quests/quest-change";
import { canCollectReward, CHANGES_ANOTHER_QUEST, type QuestEdit } from "../../src/quests/quest-plan";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";
const THREE = "Pale Moon/Sessions/Session 3.md";
const NINE = "Pale Moon/Sessions/Session 9.md";

function numberOf(path: string): number {
  const found = /(\d+)\.md$/.exec(path);
  if (found === null) return 0;
  return Number(found[1]);
}

class FakeNotes {
  readonly texts: Map<string, string>;
  readonly read: Map<string, string>;
  writes = 0;
  private campaign: Campaign | null = null;
  failOn: string | null = null;

  constructor(notes: Record<string, string>) {
    this.texts = new Map(Object.entries(notes));
    this.read = new Map(Object.entries(notes));
  }

  get vault(): EditorFiles {
    return {
      getFileByPath: (path) => {
        if (!this.texts.has(path)) return null;
        return { path } as TFile;
      },
      process: async (file, change) => {
        if (file.path === this.failOn) throw new Error("disk full");
        this.writes += 1;
        const next = change(this.textOf(file.path));
        this.texts.set(file.path, next);
        return next;
      },
      read: async (file) => this.textOf(file.path),
    };
  }

  get sessionNotes(): SessionNote[] {
    return [...this.read].map(([path, text]) => sessionNoteOf(path, numberOf(path), text));
  }

  get current(): Campaign {
    if (this.campaign === null) this.campaign = buildCampaign(this.sessionNotes);
    return this.campaign;
  }

  quest(title: string): QuestRecord {
    const found = this.current.quests.find((record) => record.quest.title === title);
    if (found === undefined) throw new Error(`no quest ${title}`);
    return found;
  }

  private textOf(path: string): string {
    const text = this.texts.get(path);
    if (text === undefined) throw new Error(`${path} is gone`);
    return text;
  }
}

function save(notes: FakeNotes, title: string, changes: Partial<QuestEdit>, sessionPath: string): Promise<boolean> {
  const edit = { status: "active" as const, happened: "", collectReward: false, followUp: "", ...changes };
  return writeRecordChange(questSave(notes, notes.quest(title), edit, sessionPath), new SessionChangeWriter(notes.vault));
}

describe("saving a quest", () => {
  it("writes the change it planned", async () => {
    const notes = new FakeNotes({ [ONE]: "! Find it\n" });
    expect(await save(notes, "Find it", { happened: "tracks" }, ONE)).toBe(true);
    expect(notes.texts.get(ONE)).toBe("! Find it\n!+ Find it: tracks\n");
  });

  it("refuses what happened when a quest whose title starts the same way would take it, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "! Guard\n! Guard: east\n" });
    await expect(save(notes, "Guard", { happened: "east: y" }, ONE)).rejects.toThrow(GOES_ELSEWHERE);
    expect(notes.writes).toBe(0);
  });

  it("refuses a follow-up quest that a stray line would mark finished at once, writing nothing", async () => {
    const notes = new FakeNotes({ [ONE]: "! T\n", [TWO]: "", [THREE]: "!= Return it, after: T: done\n" });
    await expect(save(notes, "T", { followUp: "Return it" }, TWO)).rejects.toThrow(CHANGES_ANOTHER_QUEST);
    expect(notes.writes).toBe(0);
  });

  it("says first that what happened would go elsewhere when the plan would be refused too", async () => {
    const notes = new FakeNotes({ [ONE]: "! Guard\n! Guard: east\n" });
    notes.texts.set(NINE, "");
    await expect(save(notes, "Guard", { happened: "east: y" }, NINE)).rejects.toThrow(GOES_ELSEWHERE);
    expect(notes.writes).toBe(0);
  });
});

describe("a quest's reward", () => {
  it("isn't offered when it reads as money paid out", () => {
    const notes = new FakeNotes({ [ONE]: "! Pay the toll, reward: paid 5 gp\n" });
    expect(canCollectReward(notes.quest("Pay the toll"), notes.current.coins)).toBe(false);
  });
});
