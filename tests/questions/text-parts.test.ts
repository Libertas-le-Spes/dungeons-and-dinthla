import { describe, expect, it } from "vitest";
import { textPartsOf } from "../../src/questions/text-parts";

describe("textPartsOf", () => {
  it("keeps plain text whole when there are no keywords", () => {
    expect(textPartsOf("Who sent the letter", [])).toEqual([{ text: "Who sent the letter", link: null, marked: false }]);
  });

  it("splits out a linked name, showing its alias and pointing at its note", () => {
    expect(textPartsOf("Ask [[Lady Vess|the lady]] why", [])).toEqual([
      { text: "Ask ", link: null, marked: false },
      { text: "the lady", link: "Lady Vess", marked: false },
      { text: " why", link: null, marked: false },
    ]);
  });

  it("marks each keyword wherever it appears, whatever its capitals", () => {
    expect(textPartsOf("Old mill, old wheel", ["old"])).toEqual([
      { text: "Old", link: null, marked: true },
      { text: " mill, ", link: null, marked: false },
      { text: "old", link: null, marked: true },
      { text: " wheel", link: null, marked: false },
    ]);
  });

  it("marks a keyword inside a linked name", () => {
    expect(textPartsOf("[[Old Mill]]", ["mill"])).toEqual([
      { text: "Old ", link: "Old Mill", marked: false },
      { text: "Mill", link: "Old Mill", marked: true },
    ]);
  });

  it("marks the longer of two keywords that overlap", () => {
    expect(textPartsOf("lantern", ["lan", "lantern"])).toEqual([{ text: "lantern", link: null, marked: true }]);
  });

  it("treats a keyword's symbols as plain text", () => {
    expect(textPartsOf("a (b) c", ["(b)"])).toEqual([
      { text: "a ", link: null, marked: false },
      { text: "(b)", link: null, marked: true },
      { text: " c", link: null, marked: false },
    ]);
  });
});
