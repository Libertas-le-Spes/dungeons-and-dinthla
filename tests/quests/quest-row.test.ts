import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { addQuestRow } from "../../src/quests/quest-row";
import { obsidianDocument } from "../views/obsidian-dom";

function rowsFor(lines: string[]): HTMLElement {
  const campaign = buildCampaign([{ path: "Pale Moon/Sessions/Session 2.md", number: 2, firstLine: 0, text: lines.join("\n") }]);
  const list = obsidianDocument().createElement("ul");
  const actions = { openSource: vi.fn(), openLink: vi.fn() };
  for (const record of campaign.quests) addQuestRow(list, record, [], actions);
  return list;
}

function textOf(row: Element, selector: string): string {
  return String(row.querySelector(selector)?.textContent);
}

describe("addQuestRow", () => {
  it("shows an active quest's mark, title, giver, reward and session", () => {
    const [row] = rowsFor(["! Find the missing caravan, from: [[Lady Vess]], reward: 200 gp"]).querySelectorAll(".dd-row");
    expect(textOf(row!, ".dd-mark")).toBe("!");
    expect(textOf(row!, ".dd-title-line")).toBe("Find the missing caravan");
    expect(textOf(row!, ".dd-facts")).toBe("From [[Lady Vess]]Reward 200 gp");
    expect(textOf(row!, ".dd-meta")).toBe("Session 2");
    expect(row!.querySelector(".dd-answer")).toBeNull();
  });

  it("shows a completed quest's tick, what happened and its status", () => {
    const [row] = rowsFor(["! Find it", "!= Find it: found under the Old Mill"]).querySelectorAll(".dd-row");
    expect(textOf(row!, ".dd-mark")).toBe("✓");
    expect(textOf(row!, ".dd-answer")).toBe("found under the Old Mill");
    expect(textOf(row!, ".dd-meta")).toBe("Completed · Session 2");
    expect(row!.querySelector(".dd-status-done")).not.toBeNull();
  });

  it("strikes through an abandoned quest and marks it gone", () => {
    const [row] = rowsFor(["! Guard the bridge", "!x Guard the bridge: it burned"]).querySelectorAll(".dd-row");
    expect(textOf(row!, ".dd-mark")).toBe("✕");
    expect(row!.querySelector(".dd-mark-gone")).not.toBeNull();
    expect(row!.querySelector(".dd-title-line.dd-gone")).not.toBeNull();
    expect(textOf(row!, ".dd-meta")).toBe("Abandoned · Session 2");
  });

  it("leaves out facts a quest doesn't have", () => {
    const [row] = rowsFor(["! Guard the bridge"]).querySelectorAll(".dd-row");
    expect(textOf(row!, ".dd-facts")).toBe("");
  });
});
