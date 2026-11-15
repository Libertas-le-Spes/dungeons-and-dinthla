import { describe, expect, it } from "vitest";
import { characterReferenceKind } from "../../src/kinds/character-reference-kind";
import { placeReferenceKind } from "../../src/kinds/place-reference-kind";
import { REFERENCE_KIND_LIST, REFERENCE_KINDS } from "../../src/kinds/reference-kinds";

describe("the reference kinds", () => {
  it("keeps characters in Characters and opens them on the cast page", () => {
    expect(characterReferenceKind).toEqual({ name: "character", label: "Character", folder: "Characters", page: "cast" });
  });

  it("keeps places in Places and opens them on the note page", () => {
    expect(placeReferenceKind).toEqual({ name: "place", label: "Place", folder: "Places", page: "note" });
  });

  it("finds each kind under its own name", () => {
    expect(REFERENCE_KINDS.character).toBe(characterReferenceKind);
    expect(REFERENCE_KINDS.place).toBe(placeReferenceKind);
  });

  it("lists every kind once, so each one gets its own rules", () => {
    expect(REFERENCE_KIND_LIST).toHaveLength(Object.keys(REFERENCE_KINDS).length);
    expect(REFERENCE_KIND_LIST).toContain(characterReferenceKind);
    expect(REFERENCE_KIND_LIST).toContain(placeReferenceKind);
  });
});
