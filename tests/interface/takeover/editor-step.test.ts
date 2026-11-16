import { describe, expect, it } from "vitest";
import { addEditorItem, openShownInEditor } from "../../../src/interface/takeover/editor-step";
import { FakeEditorStep } from "../fake-editor-step";
import { firstOf } from "../../stubs/lists";
import { Menu } from "../../stubs/obsidian";

const MIRA = "Pale Moon/Characters/Mira.md";

function titlesOf(menu: Menu): string[] {
  const titles: string[] = [];
  for (const item of menu.items) titles.push(item.title);
  return titles;
}

describe("addEditorItem", () => {
  it("adds Open in Obsidian's editor to the tab's menu, which opens the note the tab shows", () => {
    const step = new FakeEditorStep([MIRA]);
    const menu = new Menu();
    addEditorItem(menu, step, MIRA);
    expect(titlesOf(menu)).toEqual(["Open in Obsidian's editor"]);
    expect(firstOf(menu.items).icon).toBe("file-pen-line");
    expect(step.opened).toEqual([]);
    firstOf(menu.items).click();
    expect(step.opened).toEqual([MIRA]);
  });

  it("adds nothing while the tab shows no note that can open in the editor", () => {
    const step = new FakeEditorStep([MIRA]);
    const menu = new Menu();
    addEditorItem(menu, step, null);
    addEditorItem(menu, step, "Pale Moon/Characters.base");
    expect(menu.items).toEqual([]);
    expect(step.asked).toEqual([null, "Pale Moon/Characters.base"]);
  });
});

describe("openShownInEditor", () => {
  it("is offered while the campaign tab shows a note, and opens nothing while Obsidian only checks", () => {
    const step = new FakeEditorStep([MIRA]);
    expect(openShownInEditor(step, MIRA, true)).toBe(true);
    expect(step.opened).toEqual([]);
  });

  it("opens the note the campaign tab shows in Obsidian's editor", () => {
    const step = new FakeEditorStep([MIRA]);
    expect(openShownInEditor(step, MIRA, false)).toBe(true);
    expect(step.opened).toEqual([MIRA]);
  });

  it("isn't offered, and opens nothing, while the campaign tab shows no such note", () => {
    const step = new FakeEditorStep([MIRA]);
    expect(openShownInEditor(step, null, false)).toBe(false);
    expect(openShownInEditor(step, "Pale Moon/Characters.base", false)).toBe(false);
    expect(step.opened).toEqual([]);
  });
});
