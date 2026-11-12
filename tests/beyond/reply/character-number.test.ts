import { describe, expect, it } from "vitest";
import { characterNumberOf } from "../../../src/beyond/reply/character-number";
import { MadeUpReply } from "../builders/made-up-reply";

describe("characterNumberOf", () => {
  it("reads the id", () => {
    expect(characterNumberOf(MadeUpReply.levelOneMonk().reader())).toBe(4242);
  });

  it("takes the id 1 and the largest whole number a number holds exactly", () => {
    expect(characterNumberOf(MadeUpReply.levelOneMonk().with(["id"], 1).reader())).toBe(1);
    expect(characterNumberOf(MadeUpReply.levelOneMonk().with(["id"], Number.MAX_SAFE_INTEGER).reader())).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("refuses a missing id", () => {
    expect(() => characterNumberOf(MadeUpReply.levelOneMonk().without(["id"]).reader())).toThrow("does not say which character it is");
  });

  it.each(["4242", null, true, [4242], { id: 4242 }, 0, -5, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 2])("refuses the id %j", (value) => {
    expect(() => characterNumberOf(MadeUpReply.levelOneMonk().with(["id"], value).reader())).toThrow("does not say which character it is");
  });
});
