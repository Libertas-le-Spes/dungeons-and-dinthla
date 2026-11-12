import { describe, expect, it } from "vitest";
import { BAD_NAME, LONG_NAME, RESERVED_NAME } from "../../../src/names/file-name";
import { itemFileNameOf, NO_NAME, refusalForItemNote } from "../../../src/funds/item-notes/item-file-name";

describe("itemFileNameOf", () => {
  it("keeps a name Obsidian allows exactly as written, a plus sign included", () => {
    expect(itemFileNameOf("Ring+1")).toBe("Ring+1");
    expect(itemFileNameOf("Potion of healing (greater)")).toBe("Potion of healing (greater)");
  });

  it("swaps each character Obsidian forbids in a file name for a dash", () => {
    expect(itemFileNameOf("Ring: +1")).toBe("Ring- +1");
    for (const forbidden of ["\\", "/", ":", "*", "?", '"', "<", ">", "|", "#", "^", "[", "]"]) {
      expect(itemFileNameOf(`Ring${forbidden}One`)).toBe("Ring-One");
    }
  });

  it("swaps every forbidden character in a name, not just the first", () => {
    expect(itemFileNameOf("A:B:C?")).toBe("A-B-C-");
  });
});

describe("refusalForItemNote", () => {
  it("accepts a name that is allowed, or that becomes allowed once its forbidden characters are swapped", () => {
    expect(refusalForItemNote("Ring+1")).toBeNull();
    expect(refusalForItemNote("Ring: +1")).toBeNull();
  });

  it("refuses a name with nothing in it", () => {
    expect(refusalForItemNote("")).toBe(NO_NAME);
    expect(refusalForItemNote("   ")).toBe(NO_NAME);
  });

  it("refuses a name that is only dots, or starts or ends with one", () => {
    expect(refusalForItemNote("..")).toBe(BAD_NAME);
    expect(refusalForItemNote("...")).toBe(BAD_NAME);
    expect(refusalForItemNote("Ring.")).toBe(BAD_NAME);
  });

  it("refuses a name too long for a file, counted in bytes once swapped", () => {
    expect(refusalForItemNote("é".repeat(130))).toBe(LONG_NAME);
    expect(refusalForItemNote("a".repeat(252))).toBeNull();
    expect(refusalForItemNote("a".repeat(253))).toBe(LONG_NAME);
  });

  it("refuses a name Windows reserves", () => {
    expect(refusalForItemNote("CON")).toBe(RESERVED_NAME);
  });

  it("refuses a name with an invisible character in it", () => {
    expect(refusalForItemNote("Ring​1")).toBe(BAD_NAME);
  });
});
