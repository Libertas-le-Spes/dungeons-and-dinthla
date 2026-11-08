import { describe, expect, it } from "vitest";
import { contrast, over, parseColour } from "./css-colour";

describe("parseColour and contrast", () => {
  it("gives white on black 21:1 and a colour on itself 1:1", () => {
    expect(contrast(parseColour("white"), parseColour("#000"))).toBeCloseTo(21, 5);
    expect(contrast(parseColour("#3a5796"), parseColour("#3a5796"))).toBe(1);
  });

  it("gives the known ratio of mid grey on white", () => {
    expect(contrast(parseColour("#767676"), parseColour("#ffffff"))).toBeCloseTo(4.54, 2);
  });

  it("mixes with transparent by fading the colour", () => {
    expect(parseColour("color-mix(in srgb, #ff0000 8%, transparent)")).toEqual({ r: 1, g: 0, b: 0, alpha: 0.08 });
  });

  it("mixes two colours in sRGB by their shares", () => {
    expect(parseColour("color-mix(in srgb, white 25%, black)").r).toBeCloseTo(0.25, 5);
  });

  it("keeps the hue when mixing toward white in OKLCH", () => {
    const lighter = parseColour("color-mix(in oklch, #3a5796 50%, white)");
    expect(lighter.b).toBeGreaterThan(lighter.r);
    expect(contrast(lighter, parseColour("white"))).toBeLessThan(contrast(parseColour("#3a5796"), parseColour("white")));
  });

  it("reads rgba and lays a faded colour over another", () => {
    expect(over(parseColour("rgba(255, 255, 255, 0.5)"), parseColour("black")).g).toBeCloseTo(0.5, 5);
  });
});
