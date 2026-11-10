import { describe, expect, it } from "vitest";
import { coinSourceKind } from "../../src/kinds/coin-source-kind";
import { itemSourceKind } from "../../src/kinds/item-source-kind";
import { markerNamed, SOURCE_MARKERS } from "../../src/kinds/source-markers";

describe("SOURCE_MARKERS", () => {
  it("lists the marker coins and items share once", () => {
    expect(coinSourceKind.marker).toBe(itemSourceKind.marker);
    expect(SOURCE_MARKERS.map((marker) => marker.symbol)).toEqual(["?", "!", "$"]);
  });
});

describe("markerNamed", () => {
  it("finds each marker by its name", () => {
    expect(markerNamed("question").symbol).toBe("?");
    expect(markerNamed("quest").symbol).toBe("!");
    expect(markerNamed("ledger")).toBe(coinSourceKind.marker);
  });
});
