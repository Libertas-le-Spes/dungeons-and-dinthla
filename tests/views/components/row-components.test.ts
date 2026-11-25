import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../../src/campaign/reading/build-campaign";
import { mountTree } from "../../../src/obsidian/views/mount/mount-tree";
import { questionShownKind } from "../../../src/questions/list/question-shown-kind";
import { LinkedText } from "../../../src/views/components/rows/linked-text";
import { HERE } from "../../../src/views/elements/bindings/open-place";
import type { ViewElement } from "../../../src/views/elements/view-element";
import { addLinkedText } from "../../../src/views/lists/linked-text";
import { ThreadRow } from "../../../src/views/threads/rows/thread-row";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { ItemEventRow } from "../../../src/dashboard/rows/item-event-row";
import { ShortCharacterCard } from "../../../src/dashboard/rows/short-character-card";
import { DIED_STANDING } from "../../../src/imports/layout/standing";
import type { CharacterCard } from "../../../src/characters/cards/character-card";
import { shapeOf } from "./same-page";

const SESSION = "Pale Moon/Sessions/Session 1.md";

function root(): HTMLElement {
  const el = obsidianDocument().createElement("div");
  el.ownerDocument.body.append(el);
  return el;
}

function mounted(...trees: ViewElement[]): HTMLElement {
  const el = root();
  for (const tree of trees) mountTree(tree, el);
  return el;
}

function campaignOf(lines: string[]) {
  return buildCampaign([{ path: SESSION, number: 1, firstLine: 0, text: lines.join("\n") }]);
}

function actions() {
  return { openRow: vi.fn(), openLink: vi.fn() };
}

const NO_OPEN = { run: vi.fn() };

describe("linked text, against today's drawing", () => {
  it.each([
    { what: "plain words", text: "Who rang the bell", keywords: [] },
    { what: "a link", text: "Ask [[Old Tom]] about the bell", keywords: [] },
    { what: "marked words and a link with a marked word inside", text: "The bell of [[Bell Tower]] rang", keywords: ["bell"] },
  ])("draws $what just as today", ({ text, keywords }) => {
    const today = root();
    addLinkedText(today, text, keywords, SESSION, actions());
    expect(shapeOf(mounted(...new LinkedText(keywords, SESSION, { openLink: vi.fn() }).build(text)))).toEqual(shapeOf(today));
  });

  it("opens a link from the note the text came from", () => {
    const opener = { openLink: vi.fn() };
    const built = mounted(...new LinkedText([], SESSION, opener).build("Ask [[Old Tom]]"));
    (built.querySelector("a") as HTMLElement).click();
    expect(opener.openLink).toHaveBeenCalledExactlyOnceWith("Old Tom", SESSION, false);
  });
});

describe("thread rows", () => {
  it("opens the thread when its row is pressed", () => {
    const [question] = questionShownKind.threadsOf(campaignOf(["? Who rang the bell"]));
    const open = { run: vi.fn() };
    const built = mounted(new ThreadRow(questionShownKind, [], { openLink: vi.fn() }).build(question!, open));
    (built.querySelector(".dd-row") as HTMLElement).click();
    expect(open.run.mock.calls).toEqual([[HERE]]);
  });
});

describe("item event rows", () => {
  it.each([
    { what: "an item named", lines: ["$ [[Mira]] Silvered lantern"], word: "Item" },
    { what: "an item sold", lines: ["$ [[Mira]] Silvered lantern", "$$ Silvered lantern :sold"], word: "Sold" },
  ])("shows $what with the ledger mark, its name and what the line did", ({ lines, word }) => {
    const [item] = campaignOf(lines).items;
    const event = item!.history[item!.history.length - 1]!;
    const row = mounted(new ItemEventRow().build({ item: item!, event }, NO_OPEN)).querySelector("li > .dd-row") as HTMLElement;
    expect(row.dataset.item).toBe("Silvered lantern");
    expect([row.dataset.path, row.dataset.line]).toEqual([SESSION, String(event.source.line)]);
    expect(Array.from(row.children).map((child) => child.className)).toEqual(["dd-mark dd-mark-ledger", "dd-body"]);
    expect([row.querySelector(".dd-mark")!.textContent, row.querySelector(".dd-text")!.textContent, row.querySelector(".dd-meta")!.textContent]).toEqual(["$", "Silvered lantern", word]);
  });
});

function cardOf(isOwn: boolean, standing: string | null, values: [string, string][]): CharacterCard {
  return { path: "Pale Moon/Characters/Mira.md", name: "Mira", values: new Map(values), isOwn, standing: { standing, imported: false, departure: null } };
}

function cardRow(card: CharacterCard): HTMLElement {
  return mounted(new ShortCharacterCard().build(card, NO_OPEN)).querySelector("li > .dd-row") as HTMLElement;
}

describe("short character cards", () => {
  it.each([
    { what: "someone else's card with every value known", card: cardOf(false, null, [["class", "Bard 3"], ["AC", "14"], ["HP", "21"]]), classes: "dd-row dd-card dd-stat-block", children: ["dd-stat-block-name", "dd-stat-block-line"], line: "Class Bard 3 · AC 14 · HP 21" },
    { what: "your own card with values not known", card: cardOf(true, null, [["class", "Bard 3"], ["AC", "?"]]), classes: "dd-row dd-card dd-card-own dd-stat-block", children: ["dd-card-own-label", "dd-stat-block-name", "dd-stat-block-line"], line: "Class Bard 3 · AC ? · HP ?" },
    { what: "a card of someone who died", card: cardOf(false, DIED_STANDING, [["class", "Bard 3"]]), classes: "dd-row dd-card dd-stat-block", children: ["dd-card-standing", "dd-stat-block-name", "dd-stat-block-line"], line: "Class Bard 3 · AC ? · HP ?" },
  ])("shows $what", ({ card, classes, children, line }) => {
    const row = cardRow(card);
    expect(row.className).toBe(classes);
    expect(Array.from(row.children).map((child) => child.className)).toEqual(children);
    expect(row.querySelector(".dd-stat-block-line")!.textContent).toBe(line);
    expect(row.dataset.path).toBe(card.path);
  });

  it("marks each value not known", () => {
    const unknown = cardRow(cardOf(false, null, [["class", "Bard 3"]])).querySelectorAll(".dd-unknown");
    expect(Array.from(unknown).map((value) => value.textContent)).toEqual(["?", "?"]);
  });
});
