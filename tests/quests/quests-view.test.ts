import { describe, expect, it } from "vitest";
import type { WorkspaceLeaf } from "obsidian";
import type { CampaignStore } from "../../src/campaign/campaign-store";
import { QUESTS_VIEW } from "../../src/quests/quests-kind";
import { QuestsView } from "../../src/quests/quests-view";

describe("QuestsView", () => {
  it("gives its type while Obsidian is still building it", () => {
    const view = new QuestsView({} as WorkspaceLeaf, {} as CampaignStore, { openRow: () => {}, openLink: () => {} }, null);
    expect(view.containerEl.getAttribute("data-type")).toBe(QUESTS_VIEW);
  });
});
