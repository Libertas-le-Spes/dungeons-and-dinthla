import { describe, expect, it } from "vitest";
import { MAX_XREF_ENTRIES } from "../../../../src/pdf/limits/pdf-limits";
import { CrossReference } from "../../../../src/pdf/xref/entries/cross-reference";
import { CompressedEntry } from "../../../../src/pdf/xref/entries/compressed-entry";
import { InFileEntry } from "../../../../src/pdf/xref/entries/in-file-entry";
import { refusalFrom } from "../../support/parsed";

describe("CrossReference", () => {
  it("keeps the first entry added for an object and ignores later ones", () => {
    const crossReference = new CrossReference();
    const first = new InFileEntry(1, 0);
    crossReference.addIfNew(5, first);
    crossReference.addIfNew(5, new InFileEntry(2, 0));
    expect(crossReference.get(5)).toBe(first);
  });

  it("has no entry for an object it was not given", () => {
    expect(new CrossReference().get(5)).toBeUndefined();
  });

  it("counts up to exactly the most entries allowed", () => {
    const crossReference = new CrossReference();
    crossReference.count(MAX_XREF_ENTRIES - 1);
    crossReference.count(1);
    expect(refusalFrom(() => crossReference.count(1))).toContain("lists too many objects");
  });

  it("names each container once, in order", () => {
    const crossReference = new CrossReference();
    crossReference.addIfNew(1, new CompressedEntry(30, 0));
    crossReference.addIfNew(2, new CompressedEntry(30, 1));
    crossReference.addIfNew(3, new CompressedEntry(12, 0));
    crossReference.addIfNew(4, new InFileEntry(9, 0));
    expect(crossReference.containerNumbers()).toEqual([12, 30]);
  });
});
