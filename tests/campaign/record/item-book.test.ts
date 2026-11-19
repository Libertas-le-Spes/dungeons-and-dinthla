import { describe, expect, it } from "vitest";
import { ItemBook } from "../../../src/campaign/record/item-book";
import { readItemChange } from "../../../src/notes/reading/item-change";

const SOURCE = { path: "Pale Moon/Sessions/Session 1.md", line: 0 };

function changeOf(line: string) {
  const change = readItemChange(line);
  if (change === null) throw new Error(`${line} isn't a change.`);
  return change;
}

describe("ItemBook", () => {
  it("keeps the links of a mention that names a holder", () => {
    const book = new ItemBook();
    book.mention({ item: "Rope", count: null, holder: "Zed", links: ["Zed", "Mira"], source: SOURCE });
    expect(book.items[0]?.links).toEqual(["Zed", "Mira"]);
  });

  it("keeps the links of the line that last changed the holder", () => {
    const book = new ItemBook();
    book.mention({ item: "Rope", count: null, holder: "Zed", links: ["Zed"], source: SOURCE });
    book.change(changeOf("$$ Rope :changed to Old Tom, kept for [[Mira]]"), SOURCE);
    expect(book.items[0]?.links).toEqual(["Mira"]);
  });

  it("gives the event of a gone line the links of that line", () => {
    const book = new ItemBook();
    book.mention({ item: "Rope", count: null, holder: "Zed", links: ["Zed"], source: SOURCE });
    book.change(changeOf("$$ Rope :lost by [[Mira]]"), SOURCE);
    expect(book.items[0]?.gone?.links).toEqual(["Mira"]);
    expect(book.items[0]?.links).toEqual(["Zed"]);
  });
});
