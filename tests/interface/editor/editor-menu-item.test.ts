import { describe, expect, it } from "vitest";
import type { WorkspaceLeaf } from "obsidian";
import { addEditorItem } from "../../../src/interface/editor/editor-menu-item";
import { FakeEditorStep } from "../fake-editor-step";
import { firstOf } from "../../stubs/lists";
import { Menu } from "../../stubs/obsidian";

const MIRA = "Pale Moon/Characters/Mira.md";
const TAB = {} as WorkspaceLeaf;

function titlesOf(menu: Menu): string[] {
  const titles: string[] = [];
  for (const item of menu.items) titles.push(item.title);
  return titles;
}

describe("addEditorItem", () => {
  it("adds Open in Obsidian's editor to the tab's menu, with its icon, opening nothing yet", () => {
    const step = new FakeEditorStep([MIRA]);
    const menu = new Menu();
    addEditorItem(menu, step, MIRA, TAB);
    expect(titlesOf(menu)).toEqual(["Open in Obsidian's editor"]);
    expect(firstOf(menu.items).icon).toBe("file-pen-line");
    expect(step.opened).toEqual([]);
  });

  it("opens the note the tab shows in that same tab when the item is chosen", () => {
    const step = new FakeEditorStep([MIRA]);
    const menu = new Menu();
    addEditorItem(menu, step, MIRA, TAB);
    firstOf(menu.items).click();
    expect(step.opened).toEqual([{ path: MIRA, leaf: TAB }]);
  });

  it.each([null, "Pale Moon/Characters.base"])("adds nothing while the tab shows %s, no note that can open in the editor", (shown) => {
    const step = new FakeEditorStep([MIRA]);
    const menu = new Menu();
    addEditorItem(menu, step, shown, TAB);
    expect(menu.items).toEqual([]);
    expect(step.asked).toEqual([shown]);
  });
});
