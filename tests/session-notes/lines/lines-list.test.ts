import { describe, expect, it, vi, type Mock } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { LinesList } from "../../../src/session-notes/lines/lines-list";
import { writtenLinesOf } from "../../../src/session-notes/lines/written-lines";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { stubLineOpeners } from "./stub-line-openers";

const PATH = "Pale Moon/Sessions/Session 12.md";

function sessionOf(lines: string[]): SessionNote {
  return { path: PATH, number: 12, firstLine: 0, text: lines.join("\n") };
}

function drawn(lines: string[]) {
  const root = obsidianDocument().createElement("div");
  const actions = { openRow: vi.fn(), openLink: vi.fn() };
  const openers = stubLineOpeners();
  const list = new LinesList(root, { actions, openers });
  const session = sessionOf(lines);
  list.show(writtenLinesOf(session), buildCampaign([session]));
  return { root, actions, openers, list };
}

function partsOf(item: Element): Element[] {
  const row = item.querySelector(".dd-row");
  if (row === null) return Array.from(item.children);
  return Array.from(row.children);
}

function rows(root: HTMLElement): string[][] {
  return Array.from(root.querySelectorAll(".dd-written-line")).map((item) => partsOf(item).map((part) => `${part.className}|${part.textContent}`));
}

function rowAt(root: HTMLElement, line: number): HTMLElement {
  const row = root.querySelector<HTMLElement>(`.dd-written-line[data-line="${line}"] .dd-row`);
  if (row === null) throw new Error(`No pressable note at line ${line}.`);
  return row;
}

function pressEnter(row: HTMLElement): void {
  const view = row.ownerDocument.defaultView;
  if (view === null) throw new Error("The page has no window.");
  row.dispatchEvent(new view.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
}

function closeDialog(opened: Mock, changed: boolean): void {
  const call = opened.mock.calls[0];
  if (call === undefined) throw new Error("No dialog was opened.");
  const onClosed: (changed: boolean) => void = call[call.length - 1];
  onClosed(changed);
}

describe("LinesList", () => {
  it("shows each line with its mark coloured as elsewhere and cut from its text", () => {
    const { root } = drawn(["$ 20 gp from Lady Vess", "! Ride to Thessaly", "? Who sent the letter", "Tracks lead north."]);
    expect(rows(root)).toEqual([
      ["dd-line-glyph|", "dd-line-text|Tracks lead north."],
      ["dd-line-glyph dd-marker dd-marker-question|?", "dd-line-text|Who sent the letter"],
      ["dd-line-glyph dd-marker dd-marker-quest|!", "dd-line-text|Ride to Thessaly"],
      ["dd-line-glyph dd-marker dd-marker-ledger|$", "dd-line-text|20 gp from Lady Vess"],
    ]);
  });

  it("shows the newest line, the last in the note, first", () => {
    const { root } = drawn(["Tracks lead north.", "", "? Who sent the letter", "! Ride to Thessaly"]);
    const shown = Array.from(root.querySelectorAll(".dd-written-line")).map((row) => [row.getAttribute("data-line"), row.querySelector(".dd-line-text")?.textContent]);
    expect(shown).toEqual([
      ["3", "Ride to Thessaly"],
      ["2", "Who sent the letter"],
      ["0", "Tracks lead north."],
    ]);
  });

  it("counts the notes under its heading", () => {
    expect(drawn(["? Who", "Tracks"]).root.querySelector(".dd-title")?.textContent).toBe("Notes2 notes");
    expect(drawn(["? Who"]).root.querySelector(".dd-count")?.textContent).toBe("1 note");
  });

  it("says how to add a note when the session has none, with no count", () => {
    const { root } = drawn(["", "  "]);
    expect(root.querySelector(".dd-count")?.textContent).toBe("");
    expect(Array.from(root.querySelectorAll("li")).map((row) => row.textContent)).toEqual(["No notes in this session yet. Type one above and save it."]);
  });

  it("shows links as links that open the note linked, from the session", () => {
    const { root, actions } = drawn(["! Find the caravan, from: [[Lady Vess]]"]);
    const link = root.querySelector<HTMLElement>(".dd-link a")!;
    expect(link.textContent).toBe("Lady Vess");
    link.click();
    expect(actions.openLink).toHaveBeenCalledExactlyOnceWith("Lady Vess", PATH, false);
  });

  it("ticks answered and completed lines, and strikes abandoned quests and items gone", () => {
    const { root } = drawn([
      "? Who sent the letter",
      "?= Who sent the letter: Mira",
      "! Guard the Gilded Stag",
      "!x Guard the Gilded Stag: it burned",
      "$ Silvered lantern",
      "$$ Silvered lantern :lost",
      "? Why does the wheel turn",
    ]);
    const states = Array.from(root.querySelectorAll(".dd-written-line")).map((row) => [
      row.querySelector(".dd-line-state")?.getAttribute("aria-label"),
      row.querySelector(".dd-line-state")?.textContent,
      row.querySelector(".dd-line-text")?.classList.contains("dd-line-struck"),
    ]);
    expect(states).toEqual([
      [undefined, undefined, false],
      [undefined, undefined, false],
      ["Gone", "✕", true],
      [undefined, undefined, false],
      ["Abandoned", "✕", true],
      [undefined, undefined, false],
      ["Answered", "✓", false],
    ]);
  });

  it("draws the lines again when shown again", () => {
    const { root, list } = drawn(["? Who"]);
    const session = sessionOf(["? Who", "! Ride to Thessaly"]);
    list.show(writtenLinesOf(session), buildCampaign([session]));
    expect(rows(root).map((row) => row[1])).toEqual(["dd-line-text|Ride to Thessaly", "dd-line-text|Who"]);
  });

  it("opens the dialog of a question, a quest, an item and a coin entry when its note is pressed, and no other", () => {
    const { root, openers } = drawn(["? Who sent the letter", "! Ride to Thessaly", "$ Rope", "$ 20 gp from Lady Vess"]);
    rowAt(root, 0).click();
    rowAt(root, 1).click();
    rowAt(root, 2).click();
    rowAt(root, 3).click();
    expect(openers.openQuestion).toHaveBeenCalledExactlyOnceWith({ path: PATH, line: 0 }, expect.any(Function));
    expect(openers.openQuest).toHaveBeenCalledExactlyOnceWith({ path: PATH, line: 1 }, expect.any(Function));
    expect(openers.openItem).toHaveBeenCalledExactlyOnceWith("Rope", { path: PATH, line: 2 }, expect.any(Function));
    expect(openers.openLedgerEntry).toHaveBeenCalledExactlyOnceWith({ path: PATH, line: 3 }, expect.any(Function));
  });

  it("opens the dialog from the keyboard too", () => {
    const { root, openers } = drawn(["? Who sent the letter"]);
    pressEnter(rowAt(root, 0));
    expect(openers.openQuestion).toHaveBeenCalledOnce();
  });

  it("leaves a plain text note and a follow-up that no dialog edits not pressable", () => {
    const { root } = drawn(["Tracks lead north.", "? Who sent the letter", "?= Who sent the letter: Mira"]);
    const pressable = Array.from(root.querySelectorAll(".dd-written-line")).map((item) => item.querySelector(".dd-row") !== null);
    expect(pressable).toEqual([false, true, false]);
  });

  it("gives the pressed row focus again when its dialog closes without a change", () => {
    const { root, openers } = drawn(["? Who sent the letter"]);
    root.ownerDocument.body.append(root);
    rowAt(root, 0).click();
    closeDialog(openers.openQuestion, false);
    expect(root.ownerDocument.activeElement).toBe(rowAt(root, 0));
  });

  it("gives focus to the list when the pressed note is gone after its dialog changed it", () => {
    const { root, openers, list } = drawn(["? Who sent the letter"]);
    root.ownerDocument.body.append(root);
    rowAt(root, 0).click();
    closeDialog(openers.openQuestion, true);
    const session = sessionOf(["Tracks lead north."]);
    list.show(writtenLinesOf(session), buildCampaign([session]));
    expect(root.ownerDocument.activeElement).toBe(root.querySelector(".dd-written-lines"));
  });
});
