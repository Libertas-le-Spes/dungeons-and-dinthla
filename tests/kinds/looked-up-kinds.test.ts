import { describe, expect, it } from "vitest";
import { itemTrackedKind } from "../../src/kinds/item-tracked-kind";
import { lookedUpKindBySymbol, lookedUpKindNamed } from "../../src/kinds/looked-up-kinds";
import { questTrackedKind } from "../../src/kinds/quest-tracked-kind";
import { questionTrackedKind } from "../../src/kinds/question-tracked-kind";

describe("lookedUpKindBySymbol", () => {
  it("finds the kind each lookup symbol looks up", () => {
    expect(lookedUpKindBySymbol("??")).toBe(questionTrackedKind);
    expect(lookedUpKindBySymbol("!!")).toBe(questTrackedKind);
    expect(lookedUpKindBySymbol("$$")).toBe(itemTrackedKind);
  });

  it("finds nothing for a symbol no kind looks up with", () => {
    expect(lookedUpKindBySymbol("%%")).toBeUndefined();
  });
});

describe("lookedUpKindNamed", () => {
  it("finds each looked-up kind by its name", () => {
    expect(lookedUpKindNamed("question")).toBe(questionTrackedKind);
    expect(lookedUpKindNamed("quest")).toBe(questTrackedKind);
    expect(lookedUpKindNamed("item")).toBe(itemTrackedKind);
  });
});
