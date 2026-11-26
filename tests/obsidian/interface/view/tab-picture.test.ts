import { describe, expect, it } from "vitest";
import { paintTabPicture } from "../../../../src/obsidian/interface/view/tab-picture";
import { pictureOf, shownPicture } from "../../../campaign/shown-picture";
import { obsidianDocument } from "../../../stubs/obsidian-dom";

function frame(): HTMLElement {
  return obsidianDocument().body.createDiv({ cls: "dd-campaign-frame" });
}

describe("paintTabPicture", () => {
  it("puts the picture behind the tab, under the chosen wash", () => {
    const frameEl = frame();
    paintTabPicture(frameEl, shownPicture("app://vault/Art/harbour.jpg", "subtle"));
    expect(frameEl.className).toBe("dd-campaign-frame dd-tab-picture dd-tab-wash-subtle");
    expect(pictureOf(frameEl)).toBe('url("app://vault/Art/harbour.jpg")');
  });

  it("swaps the picture and wash rather than keeping the old wash too", () => {
    const frameEl = frame();
    paintTabPicture(frameEl, shownPicture("app://vault/Art/harbour.jpg", "subtle"));
    paintTabPicture(frameEl, shownPicture("app://vault/Art/meadow.png", "strong"));
    expect(frameEl.className).toBe("dd-campaign-frame dd-tab-picture dd-tab-wash-strong");
    expect(pictureOf(frameEl)).toBe('url("app://vault/Art/meadow.png")');
  });

  it("goes back to the plain page colour when there is no picture", () => {
    const frameEl = frame();
    paintTabPicture(frameEl, shownPicture("app://vault/Art/harbour.jpg", "balanced"));
    paintTabPicture(frameEl, null);
    expect(frameEl.className).toBe("dd-campaign-frame");
    expect(pictureOf(frameEl)).toBe("");
  });
});
