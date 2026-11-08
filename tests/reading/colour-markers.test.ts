import { describe, expect, it } from "vitest";
import { Window } from "happy-dom";
import { colourMarkers } from "../../src/reading/colour-markers";

function rendered(html: string): HTMLElement {
  const document = new Window().document;
  const root = document.createElement("div");
  root.innerHTML = html;
  colourMarkers(root as unknown as HTMLElement);
  return root as unknown as HTMLElement;
}

function marks(root: HTMLElement): [string, string][] {
  return Array.from(root.querySelectorAll(".dd-marker")).map((mark) => [String(mark.textContent), mark.className]);
}

describe("colourMarkers", () => {
  it("colours the glyph at the start of each line in a paragraph", () => {
    const root = rendered("<p>? Who sent the letter<br>\n! Find the caravan<br>\nWe rode on.<br>\n$ 5 gp</p>");
    expect(marks(root)).toEqual([
      ["?", "dd-tokens dd-marker dd-marker-question"],
      ["!", "dd-tokens dd-marker dd-marker-quest"],
      ["$", "dd-tokens dd-marker dd-marker-ledger"],
    ]);
    expect(root.textContent).toBe("? Who sent the letter\n! Find the caravan\nWe rode on.\n$ 5 gp");
  });

  it("colours a bulleted line, and both characters of a follow-up", () => {
    const root = rendered("<ul><li>? Who</li><li>?= Who: <a>Mira</a></li></ul>");
    expect(marks(root).map(([text]) => text)).toEqual(["?", "?="]);
  });

  it("reads a line through its links, so an item change is coloured", () => {
    const root = rendered('<p>$$ <a class="internal-link">Silvered lantern</a> :sold 30gp</p>');
    expect(marks(root).map(([text]) => text)).toEqual(["$$"]);
  });

  it("leaves lookups, task boxes and numbered lines alone, as the readers do", () => {
    const root = rendered(
      '<p>?? letter</p><ul><li class="task-list-item"><input type="checkbox">? Who</li></ul><ol><li>? Who</li></ol>',
    );
    expect(marks(root)).toEqual([]);
  });

  it("leaves a line starting with a link alone", () => {
    expect(marks(rendered("<p><a>Mira</a> AC: 15</p>"))).toEqual([]);
  });

  it("stops a list item's lines at a nested list, which is coloured on its own", () => {
    const root = rendered("<ul><li>We rode on.<ul><li>? Who</li></ul></li></ul>");
    expect(marks(root).map(([text]) => text)).toEqual(["?"]);
  });

  it("colours a paragraph handed over on its own", () => {
    const document = new Window().document;
    const paragraph = document.createElement("p");
    paragraph.textContent = "? Who";
    colourMarkers(paragraph as unknown as HTMLElement);
    expect(paragraph.querySelectorAll(".dd-marker")).toHaveLength(1);
  });
});
