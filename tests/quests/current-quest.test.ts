import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { QuestRecord } from "../../src/campaign/campaign";
import { CHANGED_IN_NOTE } from "../../src/campaign/note-editor";
import { currentQuest, happenedWouldGoElsewhere, latestSessionOfQuest, sharesTitleWithEarlierActiveQuest } from "../../src/quests/current-quest";

function questsOf(...sessions: string[][]): QuestRecord[] {
  return buildCampaign(
    sessions.map((lines, index) => ({ path: `Pale Moon/Sessions/Session ${index + 1}.md`, number: index + 1, firstLine: 0, text: lines.join("\n") })),
  ).quests;
}

describe("currentQuest", () => {
  it("refuses a twin that slid onto the opened quest's line without its progress", () => {
    const opened = questsOf(["Intro", "! Find", "! Find"], ["!+ Find: tracks"])[0]!;
    expect(opened.progress).toHaveLength(1);
    expect(() => currentQuest(questsOf(["! Find", "! Find"], ["!+ Find: tracks"]), opened)).toThrow(CHANGED_IN_NOTE);
  });

  it("finds the quest the dialog opened, as it is now", () => {
    const [opened] = questsOf(["! Find it"]);
    expect(currentQuest(questsOf(["! Find it", "!+ Find it: tracks"]), opened!).quest.title).toBe("Find it");
  });

  it("refuses when another quest moved into its line, or it was finished elsewhere meanwhile", () => {
    const opened = questsOf(["! Alpha", "! Beta"])[1]!;
    expect(() => currentQuest(questsOf(["We rode on.", "! Alpha", "! Beta"]), opened)).toThrow(CHANGED_IN_NOTE);
    const [open] = questsOf(["! Find it"]);
    expect(() => currentQuest(questsOf(["! Find it", "!= Find it: done"]), open!)).toThrow(CHANGED_IN_NOTE);
  });
});

describe("currentQuest's facts", () => {
  it("refuses when the quest's reward or giver was changed by hand meanwhile", () => {
    const [opened] = questsOf(["! Find it, from: [[Lady Vess]], reward: 5 gp"]);
    expect(() => currentQuest(questsOf(["! Find it, from: [[Lady Vess]], reward: 50 gp"]), opened!)).toThrow(CHANGED_IN_NOTE);
    expect(() => currentQuest(questsOf(["! Find it, from: [[Mira]], reward: 5 gp"]), opened!)).toThrow(CHANGED_IN_NOTE);
  });
});

describe("sharesTitleWithEarlierActiveQuest", () => {
  it("sees an earlier active quest with the same title, and ignores a finished one", () => {
    const twice = questsOf(["! Find it", "! Find it"]);
    expect(sharesTitleWithEarlierActiveQuest(twice, twice[1]!)).toBe(true);
    const finished = questsOf(["! Find it", "!= Find it: done", "! Find it"]);
    expect(sharesTitleWithEarlierActiveQuest(finished, finished[1]!)).toBe(false);
  });
});

describe("latestSessionOfQuest", () => {
  it("gives the latest session holding the quest, its progress or its outcome", () => {
    expect(latestSessionOfQuest(questsOf(["! Find it"], [], ["!+ Find it: tracks"])[0]!, "Pale Moon")).toBe(3);
  });
});

describe("happenedWouldGoElsewhere", () => {
  it("sees what happened being read as about another active quest", () => {
    const quests = questsOf(["! Ferry", "! Ferry: the crossing"]);
    expect(happenedWouldGoElsewhere(quests, quests[0]!, "the crossing: done")).toBe(true);
    expect(happenedWouldGoElsewhere(quests, quests[0]!, "done")).toBe(false);
  });
});
