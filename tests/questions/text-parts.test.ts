import { describe, expect, it } from "vitest";
import { textRunsOf } from "../../src/questions/text-parts";

describe("textRunsOf", () => {
  it("keeps plain text whole when there are no keywords", () => {
    expect(textRunsOf("Who sent the letter", [])).toEqual([
      { linktext: null, pieces: [{ text: "Who sent the letter", marked: false }] },
    ]);
  });

  it("gives each linked name its own run, showing its alias", () => {
    expect(textRunsOf("Ask [[Lady Vess|the lady]] why", [])).toEqual([
      { linktext: null, pieces: [{ text: "Ask ", marked: false }] },
      { linktext: "Lady Vess", pieces: [{ text: "the lady", marked: false }] },
      { linktext: null, pieces: [{ text: " why", marked: false }] },
    ]);
  });

  it("keeps two links to the same note side by side apart", () => {
    expect(textRunsOf("[[Mira]][[Mira]]", []).map((run) => run.linktext)).toEqual(["Mira", "Mira"]);
  });

  it("marks each keyword wherever it appears, whatever its capitals", () => {
    expect(textRunsOf("Old mill, old wheel", ["old"])[0]?.pieces).toEqual([
      { text: "Old", marked: true },
      { text: " mill, ", marked: false },
      { text: "old", marked: true },
      { text: " wheel", marked: false },
    ]);
  });

  it("marks a keyword inside a linked name", () => {
    expect(textRunsOf("[[Old Mill]]", ["mill"])).toEqual([
      {
        linktext: "Old Mill",
        pieces: [
          { text: "Old ", marked: false },
          { text: "Mill", marked: true },
        ],
      },
    ]);
  });

  it("marks the longer of two keywords that overlap", () => {
    expect(textRunsOf("lantern", ["lan", "lantern"])[0]?.pieces).toEqual([{ text: "lantern", marked: true }]);
  });

  it("treats a keyword's symbols as plain text", () => {
    expect(textRunsOf("a (b) c", ["(b)"])[0]?.pieces).toEqual([
      { text: "a ", marked: false },
      { text: "(b)", marked: true },
      { text: " c", marked: false },
    ]);
  });
});
