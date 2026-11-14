import { describe, expect, it } from "vitest";
import { blankLinks, findLinks, findPlaceLinks, removeFirstLink, splitLinks, unlink } from "../../../src/notes/parts/link";

describe("findLinks", () => {
  it("finds every linked name in order", () => {
    expect(findLinks("[[Lady Vess]] sent it, through [[Mira]]")).toEqual(["Lady Vess", "Mira"]);
  });

  it("finds the note a link with a shown name or a heading points to", () => {
    expect(findLinks("[[Mira|M]] and [[Old Mill#Cellar]]")).toEqual(["Mira", "Old Mill"]);
  });

  it("reads a very long line of brackets quickly", () => {
    const started = performance.now();
    findLinks("[[".repeat(50_000));
    expect(performance.now() - started).toBeLessThan(200);
  });

  it("finds nothing in a line without links", () => {
    expect(findLinks("No names here")).toEqual([]);
  });
});

describe("findPlaceLinks", () => {
  it("finds only the links that start with an at sign, in order", () => {
    expect(findPlaceLinks("[[Mira]] met [[Baka]] at @[[Old Mill]] then @[[Grey Pass|the pass]]")).toEqual(["Old Mill", "Grey Pass"]);
  });

  it("finds nothing when the at sign is apart from the link", () => {
    expect(findPlaceLinks("mail @ [[Old Mill]]")).toEqual([]);
  });
});

describe("removeFirstLink", () => {
  it("removes only the first link", () => {
    expect(removeFirstLink("[[Mira]] gave [[Tor]] the axe")).toBe(" gave [[Tor]] the axe");
  });
});

describe("unlink", () => {
  it("keeps the names and drops the brackets", () => {
    expect(unlink("Return the caravan to [[Lady Vess]]")).toBe("Return the caravan to Lady Vess");
  });

  it("keeps the shown name of a link that has one", () => {
    expect(unlink("Ask [[Mira Thorne|Mira]]")).toBe("Ask Mira");
  });
});

describe("blankLinks", () => {
  it("blanks each link so the words around it keep their places", () => {
    expect(blankLinks("from [[Mira]] 5 gp")).toBe("from          5 gp");
  });
});

describe("splitLinks", () => {
  it("splits text into plain parts and links, each link with its shown text and where it leads", () => {
    expect(splitLinks("Ask [[Lady Vess|the lady]] at [[Old Mill#Wheel]]")).toEqual([
      { text: "Ask ", linktext: null },
      { text: "the lady", linktext: "Lady Vess" },
      { text: " at ", linktext: null },
      { text: "Old Mill", linktext: "Old Mill#Wheel" },
    ]);
  });

  it("keeps two links side by side apart", () => {
    expect(splitLinks("[[Mira]][[Mira|her]]")).toEqual([
      { text: "Mira", linktext: "Mira" },
      { text: "her", linktext: "Mira" },
    ]);
  });

  it("keeps text with no links whole", () => {
    expect(splitLinks("Who sent the letter")).toEqual([{ text: "Who sent the letter", linktext: null }]);
  });

  it("reads empty text as no parts", () => {
    expect(splitLinks("")).toEqual([]);
  });
});
