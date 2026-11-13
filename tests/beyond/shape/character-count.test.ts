import { describe, expect, it } from "vitest";
import { characterCountOf } from "../../../src/beyond/shape/character-count";

describe("characterCountOf", () => {
  it("counts each letter", () => {
    expect(characterCountOf("Mira")).toBe(4);
  });

  it("counts an emoji as one character, though it takes two units", () => {
    expect(characterCountOf("\u{1f319}")).toBe(1);
  });

  it("counts a lone surrogate as one character", () => {
    expect(characterCountOf("a\ud800b")).toBe(3);
  });

  it("counts nothing as zero", () => {
    expect(characterCountOf("")).toBe(0);
  });
});
