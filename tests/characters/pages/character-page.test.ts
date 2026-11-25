import { describe, expect, it, vi } from "vitest";
import { ALL_CHARACTERS, CharacterPage } from "../../../src/characters/pages/character-page";
import { Div } from "../../../src/views/elements/kinds/containers";
import { PageFrame } from "../../../src/obsidian/views/frames/page-frame";
import { PLAIN_KIT } from "../../../src/obsidian/views/mount/mount-kit";
import { obsidianDocument } from "../../stubs/obsidian-dom";

function madeUpSheet() {
  return { tree: () => new Div({ text: "sheet of Mira" }), started: vi.fn(), stopped: vi.fn() };
}

function openPage() {
  const root = obsidianDocument().createElement("div");
  root.ownerDocument.body.append(root);
  root.createDiv({ text: "left from the page before" });
  const sheet = madeUpSheet();
  const showGallery = vi.fn();
  const frame = new PageFrame(root, new CharacterPage(sheet, showGallery), PLAIN_KIT);
  frame.load();
  return { root, frame, sheet, showGallery };
}

describe("CharacterPage", () => {
  it("shows a way back to all characters above the character's sheet, and starts the sheet once it is drawn", () => {
    const { root, sheet } = openPage();
    expect([...root.children].map((child) => child.textContent)).toEqual([ALL_CHARACTERS, "sheet of Mira"]);
    expect(ALL_CHARACTERS).toBe("← All characters");
    expect(sheet.started).toHaveBeenCalledOnce();
    expect(sheet.stopped).not.toHaveBeenCalled();
  });

  it("shows the gallery when the way back is pressed", () => {
    const { root, showGallery } = openPage();
    root.querySelector<HTMLElement>(".dd-back")!.click();
    expect(showGallery).toHaveBeenCalledOnce();
  });

  it("stops the sheet when it is closed", () => {
    const { frame, sheet } = openPage();
    frame.unload();
    expect(sheet.stopped).toHaveBeenCalledOnce();
  });
});
