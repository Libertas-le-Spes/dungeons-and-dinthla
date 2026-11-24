import { describe, expect, it } from "vitest";
import { Component } from "obsidian";
import { buildCampaign } from "../../src/campaign/reading/build-campaign";
import type { Campaign, SessionNote } from "../../src/campaign/record/campaign";
import type { CampaignStore } from "../../src/campaign/reading/campaign-store";
import type { CharacterNotes } from "../../src/characters/reading/character-notes";
import { DashboardPage, type DashboardActions } from "../../src/dashboard/dashboard-page";
import { obsidianDocument } from "../stubs/obsidian-dom";
import { STUB_SYNTAX } from "../host/stub-syntax";

const SESSION: SessionNote = { path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: "? Who sent the letter\n! Find the caravan" };

function nothing(): void {}

const actions: DashboardActions = {
  openRow: nothing,
  openLink: nothing,
  openQuestion: nothing,
  openQuest: nothing,
  openLedgerEntry: nothing,
  openItem: nothing,
  showQuestions: nothing,
  showQuests: nothing,
  showFunds: nothing,
  showCharacters: nothing,
  openCharacterSheet: nothing,
  startSession: nothing,
  writeNotes: nothing,
  sessionHeadingOf: () => "Session 1",
};

const notes = {
  holds: () => true,
  textOf: async () => "",
  pathOfLink: (linktext: string) => linktext,
  isOwnCharacter: () => false,
  campaignFolders: () => ["Pale Moon"],
  filesIn: () => [],
  sessionsOf: async () => [],
  onNoteChanged: () => nothing,
} as unknown as CharacterNotes;

function countingQuestionReads(campaign: Campaign, reads: { count: number }): Campaign {
  return {
    ...campaign,
    get questions() {
      reads.count += 1;
      return campaign.questions;
    },
  };
}

function readsOnRedraw(loads: number): number {
  const reads = { count: 0 };
  let redraw = nothing;
  const store = {
    current: countingQuestionReads(buildCampaign([SESSION]), reads),
    sessionNotes: [SESSION],
    campaignFolder: "Pale Moon",
    subscribe: (next: () => void) => {
      redraw = next;
      return nothing;
    },
  };
  const root = obsidianDocument().createElement("div");
  const page = new DashboardPage(root, store as unknown as CampaignStore, notes, actions, () => new Component(), STUB_SYNTAX);
  for (let load = 0; load < loads; load++) {
    page.unload();
    page.load();
  }
  reads.count = 0;
  redraw();
  return reads.count;
}

describe("DashboardPage loaded again", () => {
  it("draws each panel once on a redraw, not once more for every earlier load", () => {
    expect(readsOnRedraw(1)).toBe(2);
    expect(readsOnRedraw(2)).toBe(readsOnRedraw(1));
  });
});
