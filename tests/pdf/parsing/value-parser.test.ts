import { describe, expect, it } from "vitest";
import { ByteCursor } from "../../../src/pdf/bytes/byte-cursor";
import { MAX_ITEMS_IN_CONTAINER, MAX_VALUES_PARSED } from "../../../src/pdf/limits/pdf-limits";
import { VALUE_PARSER } from "../../../src/pdf/parsing/object-readers";
import { WorkBudget } from "../../../src/pdf/work/work-budget";
import { bytesOfText } from "../support/cursors";
import { refusalFrom } from "../support/parsed";

const ARRAY_OF_ONES = `[${"1 ".repeat(MAX_ITEMS_IN_CONTAINER - 1)}]`;

function parseTimes(times: number, text: string): string {
  const bytes = bytesOfText(text);
  const work = new WorkBudget(bytes.byteLength * (times + 1), () => 0);
  return refusalFrom(() => {
    for (let round = 0; round < times; round += 1) VALUE_PARSER.read(new ByteCursor(bytes, work, 0), 0);
  });
}

describe("the count of values parsed over the whole read", () => {
  it("allows exactly the most values, an array of ten thousand values parsed a hundred times", () => {
    expect(parseTimes(MAX_VALUES_PARSED / MAX_ITEMS_IN_CONTAINER, ARRAY_OF_ONES)).toBe("");
  });

  it("refuses one value more", () => {
    expect(parseTimes(MAX_VALUES_PARSED / MAX_ITEMS_IN_CONTAINER + 1, ARRAY_OF_ONES)).toContain("too many values to read");
  });

  it("counts a value that is a single number", () => {
    expect(parseTimes(MAX_VALUES_PARSED + 1, "1")).toContain("too many values to read");
    expect(parseTimes(MAX_VALUES_PARSED, "1")).toBe("");
  });
});
