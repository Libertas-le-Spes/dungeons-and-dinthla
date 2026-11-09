import { describe, expect, it } from "vitest";
import { obsidianDocument } from "./obsidian-dom";

function flexRow(): HTMLElement {
  const row = obsidianDocument().createElement("div");
  row.style.display = "flex";
  return row;
}

describe("the Obsidian element helpers in tests", () => {
  it("gives a hidden element back the display it had, as Obsidian does", () => {
    const row = flexRow();
    row.toggle(false);
    expect(row.style.display).toBe("none");
    row.toggle(true);
    expect(row.style.display).toBe("flex");
    expect(row.hasAttribute("data-display")).toBe(false);
  });

  it("keeps the display it had when an element is hidden twice", () => {
    const row = flexRow();
    row.hide();
    row.hide();
    row.show();
    expect(row.style.display).toBe("flex");
  });

  it("adds a class when told to and takes it away when told not to", () => {
    const row = flexRow();
    row.toggleClass("in-bar", true);
    expect(row.classList.contains("in-bar")).toBe(true);
    row.toggleClass("in-bar", false);
    expect(row.classList.contains("in-bar")).toBe(false);
  });

  it("reads a textarea's Windows and old Mac line endings as plain new lines, as browsers do", () => {
    const box = obsidianDocument().createElement("textarea");
    box.value = "The wheel turns.\r\nRain.\rMist.";
    expect(box.value).toBe("The wheel turns.\nRain.\nMist.");
  });
});
