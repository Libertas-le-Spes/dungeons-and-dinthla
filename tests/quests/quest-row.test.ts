import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { addQuestRow } from "../../src/quests/quest-row";
import { obsidianDocument } from "../views/obsidian-dom";

function setUpSessions(sessions: string[][], keywords: string[]) {
  const campaign = buildCampaign(
    sessions.map((lines, index) => ({ path: `Pale Moon/Sessions/Session ${index + 2}.md`, number: index + 2, firstLine: 0, text: lines.join("\n") })),
  );
  const list = obsidianDocument().createElement("ul");
  const actions = { openRow: vi.fn(), openLink: vi.fn() };
  for (const record of campaign.quests) addQuestRow(list, record, keywords, actions);
  return { row: list.querySelector(".dd-row") as HTMLElement, actions };
}

function setUp(lines: string[], keywords: string[] = []) {
  return setUpSessions([lines], keywords);
}

function textOf(row: HTMLElement, selector: string): string | null | undefined {
  return row.querySelector(selector)?.textContent;
}

describe("addQuestRow", () => {
  it("shows an active quest's mark, title, giver, reward and session", () => {
    const { row } = setUp(["! Find the missing caravan, from: [[Lady Vess]], reward: 200 gp"]);
    expect(textOf(row, ".dd-mark-quest")).toBe("!");
    expect(textOf(row, ".dd-text")).toBe("Find the missing caravan");
    expect(row.querySelector(".dd-abandoned")).toBeNull();
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

  it("leaves a completed quest's title not struck", () => {
    const { row } = setUp(["! Find it", "!= Find it: found under the Old Mill"]);
    expect(row.querySelector(".dd-abandoned")).toBeNull();
  });

  it("strikes through an abandoned quest and marks it abandoned", () => {
    const { row } = setUp(["! Guard the bridge", "!x Guard the bridge: it burned"]);
    expect(textOf(row, ".dd-mark-abandoned")).toBe("✕");
    expect(row.querySelector(".dd-text.dd-abandoned")).not.toBeNull();
    expect(row.querySelector(".dd-status-completed")).toBeNull();
    expect(textOf(row, ".dd-meta")).toBe("Abandoned · Session 2");
  });

  it("labels a completed quest's tick as completed and an abandoned quest's cross as abandoned", () => {
    expect(setUp(["! Find it", "!= Find it: found"]).row.querySelector(".dd-mark")?.getAttribute("aria-label")).toBe("Completed");
    expect(setUp(["! Guard it", "!x Guard it: it burned"]).row.querySelector(".dd-mark")?.getAttribute("aria-label")).toBe("Abandoned");
  });

  it("leaves the facts out when a quest has none", () => {
    expect(setUp(["! Guard the bridge"]).row.querySelector(".dd-facts")).toBeNull();
  });

  it("marks the filter's words in who gave the quest", () => {
    const { row } = setUp(["! Find it, from: [[Lady Vess]]"], ["vess"]);
    expect(row.querySelector(".dd-facts mark")?.textContent).toBe("Vess");
  });

  it("opens a name linked in the title from the quest's own note", () => {
    const { row, actions } = setUp(["We rode on.", "! Find [[Old Mill]]", "!= Find Old Mill: found [[Lady Vess]]"]);
    (row.querySelector(".dd-text a.dd-link-name") as HTMLElement).click();
    expect(actions.openLink).toHaveBeenCalledExactlyOnceWith("Old Mill", "Pale Moon/Sessions/Session 2.md", false);
    expect(actions.openRow).not.toHaveBeenCalled();
  });

  it("opens a name linked in what happened from the outcome's own note", () => {
    const { row, actions } = setUpSessions([["We rode on.", "! Find it"], ["!= Find it: found [[Lady Vess]]"]], []);
    (row.querySelector(".dd-answer a.dd-link-name") as HTMLElement).click();
    expect(actions.openLink).toHaveBeenCalledExactlyOnceWith("Lady Vess", "Pale Moon/Sessions/Session 3.md", false);
    expect(actions.openRow).not.toHaveBeenCalled();
  });

  it("opens the session at the quest's line when tapped", () => {
    const { row, actions } = setUp(["We rode on.", "! Find it"]);
    row.click();
    expect(actions.openRow).toHaveBeenCalledWith({ path: "Pale Moon/Sessions/Session 2.md", line: 1 });
  });
});
