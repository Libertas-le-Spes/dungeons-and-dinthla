import { describe, expect, it, vi } from "vitest";
import { ByteCursor } from "../../../src/pdf/bytes/byte-cursor";
import { VALUE_PARSER } from "../../../src/pdf/parsing/object-readers";
import { WorkBudget } from "../../../src/pdf/work/work-budget";
import { bytesOfText } from "../support/cursors";

function valuesCountedIn(text: string): number {
  const bytes = bytesOfText(text);
  const work = new WorkBudget(bytes.byteLength, () => 0);
  const counting = vi.spyOn(work, "countValue");
  VALUE_PARSER.read(new ByteCursor(bytes, work, 0), 0);
  return counting.mock.calls.length;
}

describe("the value parser", () => {
  it("counts a value that is a single number once with the read's work budget", () => {
    expect(valuesCountedIn("1")).toBe(1);
  });

  it("counts a list once and each value inside it once, however deep", () => {
    expect(valuesCountedIn("[1 [2 3] 4]")).toBe(6);
  });
});
