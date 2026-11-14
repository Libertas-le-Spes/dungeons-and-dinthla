import { describe, expect, it } from "vitest";
import { REFERENCE_KIND_LIST } from "../../../src/kinds/reference-kinds";
import { READERS_STRONGEST_FIRST, strongestKind } from "../../../src/references/readers/reference-readers";

describe("READERS_STRONGEST_FIRST", () => {
  it("has one reader for every reference kind", () => {
    expect(READERS_STRONGEST_FIRST.map((reader) => reader.kind).sort()).toEqual(REFERENCE_KIND_LIST.map((kind) => kind.name).sort());
  });
});

describe("strongestKind", () => {
  it("lets a place win over a character", () => {
    expect(strongestKind(["character", "place"])).toBe("place");
    expect(strongestKind(["place", "character"])).toBe("place");
  });

  it("gives the one kind it is given", () => {
    expect(strongestKind(["character"])).toBe("character");
    expect(strongestKind(["place"])).toBe("place");
  });

  it("gives no kind when it is given none", () => {
    expect(strongestKind([])).toBeNull();
  });
});
