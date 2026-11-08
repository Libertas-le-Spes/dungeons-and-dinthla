import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { addQuestRow } from "../../src/quests/quest-row";
import { obsidianDocument } from "../views/obsidian-dom";

function setUp(lines: string[], keywords: string[] = []) {
  const campaign = buildCampaign([{ path: "Pale Moon/Sessions/Session 2.md", number: 2, firstLine: 0, text: lines.join("\n") }]);
  const list = obsidianDocument().createElement("ul");
  const actions = { openSource: vi.fn(), openLink: vi.fn() };
  for (const record of campaign.quests) addQuestRow(list, record, keywords, actions);
  return { row: list.querySelector(".dd-row") as HTMLElement, actions };
}

function textOf(row: HTMLElement, selector: string): string | null | undefined {
  return row.querySelector(selector)?.textContent;
}

describe("addQuestRow", () => {
  it("shows an active quest's mark, title, giver, reward and session", () => {
    const { row } = setUp(["! Find the missing caravan, from: [[Lady Vess]], reward: 200 gp"]);
    expect(textOf(row, ".dd-mark-quest")).toBe("!");
    expect(textOf(row, ".dd-title-line")).toBe("Find the missing caravan");
    expect(textOf(row, ".dd-facts")).toBe("From [[Lady Vess]]Reward 200 gp");
    expect(textOf(row, ".dd-meta")).toBe("Session 2");
    expect(row.querySelector(".dd-answer")).toBeNull();
  });

  it("shows a completed quest's tick in the quest colour, what happened and its status", () => {
    const { row } = setUp(["! Find it", "!= Find it: found under the Old Mill"]);
    expect(textOf(row, ".dd-mark-quest")).toBe("✓");
    expect(textOf(row, ".dd-answer")).toBe("found under the Old Mill");
    expect(textOf(row, ".dd-meta")).toBe("Completed · Session 2");
    expect(row.querySelector(".dd-status-completed")).not.toBeNull();
  });

  it("strikes through an abandoned quest and marks it abandoned", () => {
    const { row } = setUp(["! Guard the bridge", "!x Guard the bridge: it burned"]);
    expect(textOf(row, ".dd-mark-abandoned")).toBe("✕");
    expect(row.querySelector(".dd-title-line.dd-abandoned")).not.toBeNull();
    expect(textOf(row, ".dd-meta")).toBe("Abandoned · Session 2");
  });

  it("leaves the facts out when a quest has none", () => {
    expect(setUp(["! Guard the bridge"]).row.querySelector(".dd-facts")).toBeNull();
  });

  it("marks the filter's words in who gave the quest", () => {
    const { row } = setUp(["! Find it, from: [[Lady Vess]]"], ["vess"]);
    expect(row.querySelector(".dd-facts mark")?.textContent).toBe("Vess");
  });

  it("opens the session at the quest's line when tapped", () => {
    const { row, actions } = setUp(["We rode on.", "! Find it"]);
    row.click();
    expect(actions.openSource).toHaveBeenCalledWith({ path: "Pale Moon/Sessions/Session 2.md", line: 1 });
  });
});
