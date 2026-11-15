import { describe, expect, it } from "vitest";
import { makeScrollList } from "../../../src/views/lists/scroll-list";
import { obsidianDocument } from "../../stubs/obsidian-dom";

describe("makeScrollList", () => {
  it("makes the element a labelled scroll box that the keyboard can reach", () => {
    const element = obsidianDocument().createElement("ul");
    makeScrollList({ element, label: "Ledger entries" });
    expect(element.classList.contains("dd-scroll-list")).toBe(true);
    expect(element.getAttribute("tabindex")).toBe("0");
    expect(element.getAttribute("aria-label")).toBe("Ledger entries");
  });
});
