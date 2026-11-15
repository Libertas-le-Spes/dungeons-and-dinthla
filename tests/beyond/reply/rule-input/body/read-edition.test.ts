import { describe, expect, it } from "vitest";
import { agreedEdition } from "../../../../../src/beyond/reply/rule-input/body/agreed-edition";
import { editionOf } from "../../../../../src/beyond/reply/rule-input/body/read-edition";
import { MadeUpReply } from "../../../builders/made-up-reply";

function classWith(sourceIds: unknown[]): object {
  return { level: 1, definition: { name: "Monk", hitDice: 8, sources: sourceIds.map((sourceId) => ({ sourceId })) } };
}

function editionWith(...classes: object[]): string {
  return editionOf(MadeUpReply.levelOneMonk().with(["classes"], classes).reader());
}

describe("editionOf", () => {
  it("is 2024 for a class from the 2024 Player's Handbook", () => {
    expect(editionWith(classWith([145]))).toBe("2024");
  });

  it("is 2014 for a class from the 2014 Player's Handbook", () => {
    expect(editionWith(classWith([1]))).toBe("2014");
  });

  it("is not stated for a class from a source it does not know", () => {
    expect(editionWith(classWith([9999]))).toBe("not stated");
  });

  it("is not stated for a class that lists no sources, or whose reply has none", () => {
    expect(editionWith(classWith([]))).toBe("not stated");
    expect(editionWith({ level: 1, definition: { name: "Monk", hitDice: 8 } })).toBe("not stated");
  });

  it("ignores a source it does not know beside one it does", () => {
    expect(editionWith(classWith([1, 2, 9999]))).toBe("2014");
  });

  it("is not stated for a class from both editions", () => {
    expect(editionWith(classWith([1, 145]))).toBe("not stated");
  });

  it("ignores a source id that is not a number", () => {
    expect(editionWith(classWith(["145", null]))).toBe("not stated");
  });

  it("is the edition every class agrees on", () => {
    expect(editionWith(classWith([145]), classWith([145]))).toBe("2024");
  });

  it("is not stated when the classes come from different editions", () => {
    expect(editionWith(classWith([145]), classWith([1]))).toBe("not stated");
  });

  it("is not stated when one class has no known source", () => {
    expect(editionWith(classWith([145]), classWith([9999]))).toBe("not stated");
  });
});

describe("agreedEdition", () => {
  it("is not stated for no editions", () => {
    expect(agreedEdition([])).toBe("not stated");
  });
});
