import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { CampaignStore } from "../../src/campaign/campaign-store";
import { questionsKind } from "../../src/questions/questions-kind";
import { ListPage } from "../../src/views/list-page";
import { obsidianDocument } from "../views/obsidian-dom";

function openQuestions(lines: string[]): HTMLElement {
  const campaign = buildCampaign([{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: lines.join("\n") }]);
  const store = { current: campaign, subscribe: () => () => {} };
  const root = obsidianDocument().createElement("div");
  new ListPage(root, store as unknown as CampaignStore, vi.fn(), vi.fn(), questionsKind, null).load();
  return root;
}

describe("questionsKind", () => {
  it("heads the Questions page and says how to ask one when none is open", () => {
    const root = openQuestions([]);
    expect(root.querySelector(".dd-title")?.firstChild?.textContent).toBe("Open questions");
    expect(root.querySelector(".dd-filter")?.getAttribute("aria-label")).toBe("Filter questions");
    expect(root.querySelector(".dd-list .dd-empty")?.textContent).toBe("No open questions. Start a note with ? to ask one.");
    expect(root.querySelector("summary")?.firstChild?.textContent).toBe("Answered");
    expect(root.querySelector(".dd-folded .dd-empty")?.textContent).toBe("Nothing answered yet.");
  });
});
