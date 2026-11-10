import { describe, expect, it } from "vitest";
import { FOLLOW_UP_NAMES } from "../../src/kinds/follow-up-name";
import { followUpSymbolOf } from "../../src/kinds/follow-ups";
import { lookedUpKindNamed } from "../../src/kinds/looked-up-kinds";
import { LOOKUP_KIND_NAMES } from "../../src/kinds/lookup-kind-name";
import { ALL_MARKERS } from "../../src/kinds/tracked-markers";
import { readLookup } from "../../src/lookups/lookup";
import { readFollowUp } from "../../src/notes/follow-up";
import { readMarker } from "../../src/notes/marker";

describe("the line readers and the kinds", () => {
  it("read each marker a kind holds as that marker", () => {
    for (const marker of ALL_MARKERS) expect(readMarker(`${marker.symbol} Brass key`).marker).toBe(marker.name);
  });

  it("read each follow-up symbol a kind holds as that follow-up", () => {
    for (const name of FOLLOW_UP_NAMES) expect(readFollowUp(`${followUpSymbolOf(name)} Brass key: found`)).toMatchObject({ kind: name });
  });

  it("read each lookup symbol a kind holds as a lookup of that kind", () => {
    for (const name of LOOKUP_KIND_NAMES) expect(readLookup(`${lookedUpKindNamed(name).lookup.symbol} brass`)).toMatchObject({ kind: name });
  });

  it("read no lookup for a symbol no kind holds", () => {
    expect(readLookup("%% brass")).toBeNull();
  });
});
