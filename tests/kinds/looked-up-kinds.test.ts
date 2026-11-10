import { describe, expect, it } from "vitest";
import { itemSourceKind } from "../../src/kinds/item-source-kind";
import { lookedUpKindNamed, lookedUpKindOf } from "../../src/kinds/looked-up-kinds";
import { questSourceKind } from "../../src/kinds/quest-source-kind";
import { questionSourceKind } from "../../src/kinds/question-source-kind";

describe("lookedUpKindOf", () => {
  it("finds the kind each lookup marker looks up", () => {
    expect(lookedUpKindOf("??")).toBe(questionSourceKind);
    expect(lookedUpKindOf("!!")).toBe(questSourceKind);
    expect(lookedUpKindOf("$$")).toBe(itemSourceKind);
  });
});

describe("lookedUpKindNamed", () => {
  it("finds each looked-up kind by its name", () => {
    expect(lookedUpKindNamed("question")).toBe(questionSourceKind);
    expect(lookedUpKindNamed("quest")).toBe(questSourceKind);
    expect(lookedUpKindNamed("item")).toBe(itemSourceKind);
  });
});
