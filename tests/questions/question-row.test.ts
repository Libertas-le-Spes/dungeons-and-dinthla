import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { addQuestionRow } from "../../src/questions/question-row";
import { obsidianDocument } from "../views/obsidian-dom";

function setUp(lines: string[], keywords: string[] = []) {
  const campaign = buildCampaign([{ path: "Pale Moon/Sessions/Session 1.md", number: 1, firstLine: 0, text: lines.join("\n") }]);
  const list = obsidianDocument().createElement("ul");
  const actions = { openRow: vi.fn(), openLink: vi.fn() };
  for (const question of campaign.questions) addQuestionRow(list, question, keywords, actions);
  return { row: list.querySelector(".dd-row") as HTMLElement, actions };
}

describe("addQuestionRow", () => {
  it("shows an open question's mark, text and session", () => {
    const { row } = setUp(["? Who sent the letter"]);
    expect(row.querySelector(".dd-mark-question")?.textContent).toBe("?");
    expect(row.querySelector(".dd-text")?.textContent).toBe("Who sent the letter");
    expect(row.querySelector(".dd-meta")?.textContent).toBe("Session 1");
  });

  it("shows an answered question's tick and its answer", () => {
    const { row } = setUp(["? Who sent the letter", "?= Who sent the letter: [[Lady Vess]] sent it"]);
    expect(row.querySelector(".dd-mark")?.textContent).toBe("✓");
    expect(row.querySelector(".dd-answer")?.textContent).toBe("[[Lady Vess]] sent it");
  });

  it("opens the session at the question's line when tapped", () => {
    const { row, actions } = setUp(["We rode on.", "? Who"]);
    row.click();
    expect(actions.openRow).toHaveBeenCalledWith({ path: "Pale Moon/Sessions/Session 1.md", line: 1 });
  });

  it("opens a linked name's note, not the session, when the name is tapped", () => {
    const { row, actions } = setUp(["? Why does [[Old Mill#Wheel|the wheel]] turn"]);
    (row.querySelector("a.dd-link-name") as HTMLElement).click();
    expect(actions.openLink).toHaveBeenCalledWith("Old Mill#Wheel", "Pale Moon/Sessions/Session 1.md");
    expect(actions.openRow).not.toHaveBeenCalled();
  });

  it("marks the filter's words", () => {
    const { row } = setUp(["? Who sent the letter"], ["letter"]);
    expect(row.querySelector("mark")?.textContent).toBe("letter");
  });

  it("opens the session when Enter is pressed on the focused row", () => {
    const { row, actions } = setUp(["? Who"]);
    row.dispatchEvent(new row.ownerDocument.defaultView!.KeyboardEvent("keydown", { key: "Enter" }));
    expect(actions.openRow).toHaveBeenCalledWith({ path: "Pale Moon/Sessions/Session 1.md", line: 0 });
  });
});
