import { describe, expect, it } from "vitest";
import { sizeOf } from "../../../../src/beyond/reply/rule-input/body/read-size";
import { MadeUpReply } from "../../builders/made-up-reply";

function sized(...sizes: unknown[]): MadeUpReply {
  const entries = sizes.map((subType) => ({ type: "size", subType }));
  return MadeUpReply.levelOneMonk().with(["modifiers", "race"], entries);
}

describe("sizeOf", () => {
  it("takes the one size the race's modifiers state", () => {
    expect(sizeOf(sized("large").reader())).toBe("large");
  });

  it("takes the size from the race's size number when no modifier states one", () => {
    expect(sizeOf(sized().reader())).toBe("medium");
    expect(sizeOf(sized().with(["race", "sizeId"], 3).reader())).toBe("small");
  });

  it("does not know a size number it was not told", () => {
    expect(sizeOf(sized().with(["race", "sizeId"], 10).reader())).toBe("");
    expect(sizeOf(sized().with(["race", "sizeId"], "4").reader())).toBe("");
    expect(sizeOf(sized().without(["race", "sizeId"]).reader())).toBe("");
  });

  it("does not know the size when the race's modifiers state two", () => {
    expect(sizeOf(sized("small", "medium").reader())).toBe("");
  });

  it("ignores a modifier that is not a size, and one with no type", () => {
    const reply = MadeUpReply.levelOneMonk().with(["modifiers", "race"], [{ type: "language", subType: "common" }, { subType: "x" }, { type: "size", subType: "small" }]);
    expect(sizeOf(reply.reader())).toBe("small");
  });
});
