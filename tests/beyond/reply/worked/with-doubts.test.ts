import { describe, expect, it } from "vitest";
import { EveryNumberBlanket, NamedBlanket } from "../../../../src/beyond/reply/rule-input/hand-set/blanket";
import type { Blanket } from "../../../../src/beyond/reply/rule-input/hand-set/blanket";
import { withDoubts } from "../../../../src/beyond/reply/worked/with-doubts";
import type { RuleInputs } from "../../../../src/beyond/reply/worked/rule-inputs";
import { KnownValue } from "../../../../src/beyond/shape/known-value";
import type { ImportedNumber } from "../../../../src/beyond/shape/imported-number";
import { NotKnownValue } from "../../../../src/beyond/shape/not-known-value";
import { Online } from "../../../../src/beyond/shape/route";
import { madeUpRuleCharacter } from "../../builders/made-up-rule-character";

const ROUTE = new Online();

function known(name: string, value: number): ImportedNumber {
  return { name, value: KnownValue.wholeNumber(value, "worked", ROUTE) };
}

function unknown(name: string, reason: string): ImportedNumber {
  return { name, value: new NotKnownValue<number>(reason, ROUTE) };
}

interface Changes {
  readonly doubts: ImportedNumber[];
  readonly setByHand: ImportedNumber[];
  readonly blankets: Blanket[];
}

function inputs(changes: Changes): RuleInputs {
  return { character: madeUpRuleCharacter({}), doubts: changes.doubts, handSet: { setByHand: changes.setByHand, blankets: changes.blankets } };
}

function summary(numbers: readonly ImportedNumber[]): string[] {
  return numbers.map((number) => `${number.name}|${number.value.isKnown}|${number.value.explanation}`);
}

describe("withDoubts", () => {
  it("replaces the number a doubt names and keeps the others in order", () => {
    const found = withDoubts([known("HP", 5), known("AC", 15), known("Speed", 30)], inputs({ doubts: [unknown("AC", "Doubted.")], setByHand: [], blankets: [] }));
    expect(summary(found)).toEqual(["HP|true|worked", "AC|false|Doubted.", "Speed|true|worked"]);
  });

  it("keeps every number when there is nothing to change", () => {
    const numbers = [known("HP", 5)];
    expect(withDoubts(numbers, inputs({ doubts: [], setByHand: [], blankets: [] }))).toEqual(numbers);
  });

  it("adds nothing for a doubt that names no number", () => {
    expect(withDoubts([known("HP", 5)], inputs({ doubts: [unknown("Luck", "Doubted.")], setByHand: [], blankets: [] }))).toHaveLength(1);
  });

  it("makes the numbers a blanket names not known, with its reason, and leaves the rest", () => {
    const found = withDoubts([known("HP", 5), known("Athletics", 3)], inputs({ doubts: [], setByHand: [], blankets: [new NamedBlanket("Set by hand.", ["Athletics"])] }));
    expect(summary(found)).toEqual(["HP|true|worked", "Athletics|false|Set by hand."]);
  });

  it("makes every number not known under a blanket for every number", () => {
    const found = withDoubts([known("HP", 5), known("AC", 15)], inputs({ doubts: [], setByHand: [], blankets: [new EveryNumberBlanket("Not read.")] }));
    expect(summary(found)).toEqual(["HP|false|Not read.", "AC|false|Not read."]);
  });

  it("uses the first blanket that covers a number", () => {
    const blankets = [new NamedBlanket("First.", ["HP"]), new EveryNumberBlanket("Second.")];
    expect(summary(withDoubts([known("HP", 5), known("AC", 1)], inputs({ doubts: [], setByHand: [], blankets })))).toEqual(["HP|false|First.", "AC|false|Second."]);
  });

  it("lets a value set by hand win over a blanket and a doubt", () => {
    const found = withDoubts([known("AC", 15)], inputs({ doubts: [unknown("AC", "Doubted.")], setByHand: [known("AC", 13)], blankets: [new EveryNumberBlanket("Not read.")] }));
    expect(summary(found)).toEqual(["AC|true|worked"]);
    expect(found.map((number) => number.value.valueOr(0))).toEqual([13]);
  });
});
