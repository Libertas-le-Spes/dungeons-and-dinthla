import { describe, expect, it } from "vitest";
import { findLinks, removeFirstLink, unlink } from "../../src/notes/link";

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
