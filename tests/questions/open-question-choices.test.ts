import { describe, expect, it } from "vitest";
import type { App, TFile } from "obsidian";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { Campaign, SessionNote, Source } from "../../src/campaign/campaign";
import type { CampaignStore } from "../../src/campaign/campaign-store";
import { CHANGED_IN_NOTE } from "../../src/campaign/note-editor";
import { sessionNoteOf } from "../../src/campaign/session-file";
import type { Gate } from "../../src/fence/gatekeeper";
import { ANSWER_GOES_ELSEWHERE } from "../../src/questions/current-question";
import { openQuestion } from "../../src/questions/open-question";
import type { QuestionEdit } from "../../src/questions/question-plan";
import { CHANGES_MORE_THAN_ASKED } from "../../src/questions/question-plan";
import { GOES_ELSEWHERE } from "../../src/quests/current-quest";
import { openQuest } from "../../src/quests/open-quest";
import type { QuestEdit } from "../../src/quests/quest-plan";
import { openedModals } from "../stubs/obsidian";

const ONE = "Pale Moon/Sessions/Session 1.md";
const TWO = "Pale Moon/Sessions/Session 2.md";

function numberOf(path: string): number {
  const found = /(\d+)\.md$/.exec(path);
  if (found === null) return 0;
  return Number(found[1]);
}

class FakeCampaign {
  readonly texts: Map<string, string>;
  writes = 0;
  read: Map<string, string>;
  private campaign: Campaign | null = null;

  constructor(notes: Record<string, string>) {
    this.texts = new Map(Object.entries(notes));
    this.read = new Map(this.texts);
  }

  get gate(): Gate {
    const fileOf = (path: string) => ({ path, basename: path.slice(path.lastIndexOf("/") + 1).replace(/\.md$/, "") }) as TFile;
    const files = {
      getFiles: () => [...this.texts.keys()].map(fileOf),
      getMarkdownFiles: () => [...this.texts.keys()].map(fileOf),
      getFileByPath: (path: string) => {
        if (!this.texts.has(path)) return null;
        return fileOf(path);
      },
      process: async (file: TFile, change: (text: string) => string) => {
        this.writes += 1;
        const next = change(this.textOf(file.path));
        this.texts.set(file.path, next);
        return next;
      },
      read: async (file: TFile) => this.textOf(file.path),
    };
    return { files } as unknown as Gate;
  }

  get store(): CampaignStore {
    const campaign = this;
    return {
      campaignFolder: "Pale Moon",
      get sessionNotes(): SessionNote[] {
        return campaign.sessionNotes;
      },
      get current(): Campaign {
        return campaign.current;
      },
    } as unknown as CampaignStore;
  }

  get sessionNotes(): SessionNote[] {
    return [...this.read].map(([path, text]) => sessionNoteOf(path, numberOf(path), text));
  }

  get current(): Campaign {
    if (this.campaign === null) this.campaign = buildCampaign(this.sessionNotes);
    return this.campaign;
  }

  readAgain(): void {
    this.read = new Map(this.texts);
    this.campaign = null;
  }

  private textOf(path: string): string {
    const text = this.texts.get(path);
    if (text === undefined) throw new Error(`${path} is gone`);
    return text;
  }
}

interface QuestionChoices {
  save(edit: QuestionEdit): Promise<boolean>;
  reopen(): Promise<boolean>;
}

interface QuestChoices {
  save(edit: QuestEdit): Promise<boolean>;
}

const app = {} as App;

function questionChoices(campaign: FakeCampaign, source: Source): QuestionChoices {
  openQuestion(app, campaign.gate, campaign.store, source, () => undefined, () => undefined, ONE);
  return (openedModals[openedModals.length - 1] as unknown as { choices: QuestionChoices }).choices;
}

function questChoices(campaign: FakeCampaign, source: Source): QuestChoices {
  openQuest(app, campaign.gate, campaign.store, source, () => undefined, () => undefined, ONE);
  return (openedModals[openedModals.length - 1] as unknown as { choices: QuestChoices }).choices;
}

function edit(changes: Partial<QuestEdit>): QuestEdit {
  return { status: "active", happened: "", collectReward: false, followUp: "", ...changes };
}

describe("the question dialog's choices", () => {
  it("checks an answer before writing it", async () => {
    const campaign = new FakeCampaign({ [ONE]: "? Whom\n? Whom: sent\n" });
    const choices = questionChoices(campaign, { path: ONE, line: 0 });
    await expect(choices.save({ answer: "sent: y", followUp: "" })).rejects.toThrow(ANSWER_GOES_ELSEWHERE);
    expect(campaign.writes).toBe(0);
  });

  it("checks a reopen before writing it", async () => {
    const campaign = new FakeCampaign({ [ONE]: "? Where\n", [TWO]: "?= Where: mill\n?= Where: mill\n" });
    const choices = questionChoices(campaign, { path: ONE, line: 0 });
    await expect(choices.reopen()).rejects.toThrow(CHANGES_MORE_THAN_ASKED);
    expect(campaign.writes).toBe(0);
  });

  it("saves the question as the campaign reads it now, refusing one changed since the dialog opened", async () => {
    const campaign = new FakeCampaign({ [ONE]: "? Who\n" });
    const choices = questionChoices(campaign, { path: ONE, line: 0 });
    campaign.texts.set(ONE, "We waited.\n? Who\n");
    campaign.readAgain();
    await expect(choices.save({ answer: "Mira", followUp: "" })).rejects.toThrow(CHANGED_IN_NOTE);
    expect(campaign.texts.get(ONE)).toBe("We waited.\n? Who\n");
  });

  it("reopens the question as the campaign reads it now, refusing one changed since the dialog opened", async () => {
    const campaign = new FakeCampaign({ [ONE]: "? Who\n?= Who: Mira\n" });
    const choices = questionChoices(campaign, { path: ONE, line: 0 });
    campaign.texts.set(ONE, "? Who\n?= Who: Lady Vess\n");
    campaign.readAgain();
    await expect(async () => choices.reopen()).rejects.toThrow(CHANGED_IN_NOTE);
    expect(campaign.writes).toBe(0);
  });
});

describe("the quest dialog's choices", () => {
  it("checks a save before writing it", async () => {
    const campaign = new FakeCampaign({ [ONE]: "! Guard\n! Guard: east\n" });
    const choices = questChoices(campaign, { path: ONE, line: 0 });
    await expect(choices.save(edit({ happened: "east: y" }))).rejects.toThrow(GOES_ELSEWHERE);
    expect(campaign.writes).toBe(0);
  });

  it("saves the quest as the campaign reads it now, refusing one changed since the dialog opened", async () => {
    const campaign = new FakeCampaign({ [ONE]: "! Find it\n" });
    const choices = questChoices(campaign, { path: ONE, line: 0 });
    campaign.texts.set(ONE, "We waited.\n! Find it\n");
    campaign.readAgain();
    await expect(choices.save(edit({ happened: "tracks" }))).rejects.toThrow(CHANGED_IN_NOTE);
    expect(campaign.texts.get(ONE)).toBe("We waited.\n! Find it\n");
  });
});
