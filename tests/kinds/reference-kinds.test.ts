import { describe, expect, it } from "vitest";
import { characterReferenceKind } from "../../src/kinds/character-reference-kind";
import { placeReferenceKind } from "../../src/kinds/place-reference-kind";
import { REFERENCE_KIND_LIST, REFERENCE_KINDS } from "../../src/kinds/reference-kinds";

describe("the reference kinds", () => {
  it("keeps characters in Characters and opens them on the cast page", () => {
    expect(characterReferenceKind).toEqual({ name: "character", folder: "Characters", page: "cast" });
  });

  it("keeps places in Places and opens them on the note page", () => {
    expect(placeReferenceKind).toEqual({ name: "place", folder: "Places", page: "note" });
  });

  it("finds each kind under its own name", () => {
    expect(REFERENCE_KINDS.character).toBe(characterReferenceKind);
    expect(REFERENCE_KINDS.place).toBe(placeReferenceKind);
  });

  it("lists every kind once, characters first", () => {
    expect(REFERENCE_KIND_LIST).toEqual([characterReferenceKind, placeReferenceKind]);
  });
});
