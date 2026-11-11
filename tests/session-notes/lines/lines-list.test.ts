import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import type { SessionNote } from "../../../src/campaign/record/campaign";
import { LinesList } from "../../../src/session-notes/lines/lines-list";
import { writtenLinesOf } from "../../../src/session-notes/lines/written-lines";
import { obsidianDocument } from "../../views/obsidian-dom";

const PATH = "Pale Moon/Sessions/Session 12.md";

function sessionOf(lines: string[]): SessionNote {
  return { path: PATH, number: 12, firstLine: 0, text: lines.join("\n") };
}

function drawn(lines: string[]) {
  const root = obsidianDocument().createElement("div");
  const actions = { openRow: vi.fn(), openLink: vi.fn() };
  const list = new LinesList(root, actions);
  const session = sessionOf(lines);
  list.show(writtenLinesOf(session), buildCampaign([session]));
  return { root, actions, list };
}

function rows(root: HTMLElement): string[][] {
  return Array.from(root.querySelectorAll(".dd-written-line")).map((row) =>
    Array.from(row.children).map((part) => `${part.className}|${part.textContent}`),
  );
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
});
