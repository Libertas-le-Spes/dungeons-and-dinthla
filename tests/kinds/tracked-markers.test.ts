import { describe, expect, it } from "vitest";
import { coinTrackedKind } from "../../src/kinds/coin-tracked-kind";
import { itemTrackedKind } from "../../src/kinds/item-tracked-kind";
import { ALL_MARKERS, markerBySymbol, markerNamed } from "../../src/kinds/tracked-markers";

describe("ALL_MARKERS", () => {
  it("lists the marker coins and items share only once", () => {
    expect(ALL_MARKERS.map((marker) => marker.symbol)).toEqual(["?", "!", "$"]);
  });
});

describe("coins and items", () => {
  it("share one marker", () => {
    expect(coinTrackedKind.marker).toBe(itemTrackedKind.marker);
  });
});

describe("markerNamed", () => {
  it("finds each marker by its name", () => {
    expect(markerNamed("question").symbol).toBe("?");
    expect(markerNamed("quest").symbol).toBe("!");
    expect(markerNamed("ledger")).toBe(coinTrackedKind.marker);
  });
});

describe("markerBySymbol", () => {
  it("finds each marker by its symbol", () => {
    expect(markerBySymbol("?")).toBe(markerNamed("question"));
    expect(markerBySymbol("!")).toBe(markerNamed("quest"));
    expect(markerBySymbol("$")).toBe(markerNamed("ledger"));
  });

  it("finds nothing for a symbol no kind uses", () => {
    expect(markerBySymbol("%")).toBeUndefined();
  });
});
