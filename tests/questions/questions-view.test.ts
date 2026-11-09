import { describe, expect, it } from "vitest";
import type { WorkspaceLeaf } from "obsidian";
import type { CampaignStore } from "../../src/campaign/campaign-store";
import { QUESTIONS_VIEW, QuestionsView } from "../../src/questions/questions-view";

describe("QuestionsView", () => {
  it("gives its type while Obsidian is still building it", () => {
    const view = new QuestionsView({} as WorkspaceLeaf, {} as CampaignStore, { openRow: () => {}, openLink: () => {} }, null);
    expect(view.containerEl.getAttribute("data-type")).toBe(QUESTIONS_VIEW);
  });
});
