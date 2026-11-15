import { describe, expect, it } from "vitest";
import { withDoubts } from "../../../../src/beyond/reply/worked/with-doubts";
import { KnownValue } from "../../../../src/beyond/shape/known-value";
import { NotKnownValue } from "../../../../src/beyond/shape/not-known-value";
import { Online } from "../../../../src/beyond/shape/route";

const ROUTE = new Online();

function known(name: string, value: number): { name: string; value: KnownValue } {
  return { name, value: KnownValue.wholeNumber(value, "worked", ROUTE) };
}

describe("withDoubts", () => {
  it("replaces the number a doubt names and keeps the others in order", () => {
    const doubt = { name: "AC", value: new NotKnownValue<number>("Doubted.", ROUTE) };
    const found = withDoubts([known("HP", 5), known("AC", 15), known("Speed", 30)], [doubt]);
    expect(found.map((number) => [number.name, number.value.isKnown])).toEqual([["HP", true], ["AC", false], ["Speed", true]]);
    expect(found[1]?.value.explanation).toBe("Doubted.");
  });

  it("keeps every number when there is no doubt", () => {
    const numbers = [known("HP", 5)];
    expect(withDoubts(numbers, [])).toEqual(numbers);
  });

  it("adds nothing for a doubt that names no number", () => {
    const doubt = { name: "Luck", value: new NotKnownValue<number>("Doubted.", ROUTE) };
    expect(withDoubts([known("HP", 5)], [doubt])).toHaveLength(1);
  });
});
