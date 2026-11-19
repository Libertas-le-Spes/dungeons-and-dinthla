import { describe, expect, it } from "vitest";
import type { ImportedItem } from "../../../src/beyond/shape/imported-item";
import { KnownValue } from "../../../src/beyond/shape/known-value";
import { NotKnownValue } from "../../../src/beyond/shape/not-known-value";
import { A_ROW_HAS_NO_COUNT, oneRowEach } from "../../../src/beyond/shape/one-row-each";
import { CleanLine } from "../../../src/beyond/text/clean-line";
import { PRINTED } from "../../../src/beyond/sheet/printed-route";

function counted(name: string, count: number): ImportedItem {
  return { name: CleanLine.of(name), count: KnownValue.wholeNumber(count, "", PRINTED) };
}

function uncounted(name: string): ImportedItem {
  return { name: CleanLine.of(name), count: new NotKnownValue("No count.", PRINTED) };
}

interface ShownRow {
  readonly name: string;
  readonly count: number | null;
}

function shownRows(items: readonly ImportedItem[]): ShownRow[] {
  const rows: ShownRow[] = [];
  for (const item of items) {
    let count: number | null = null;
    if (item.count.isKnown) count = item.count.valueOr(0);
    rows.push({ name: item.name.text, count });
  }
  return rows;
}

describe("one row for each item an import lists", () => {
  it("adds up an item listed several times into one row, where it was first listed", () => {
    const items = [counted("Dagger", 1), counted("Rope", 50), counted("Dagger", 1), counted("Dagger", 3)];
    expect(shownRows(oneRowEach(items))).toEqual([
      { name: "Dagger", count: 5 },
      { name: "Rope", count: 50 },
    ]);
  });

  it("keeps an item listed once exactly as it was read", () => {
    const rope = counted("Rope", 50);
    const [row] = oneRowEach([rope, counted("Torch", 3)]);
    expect(row).toBe(rope);
  });

  it("keeps items whose names differ apart, even only by capitals", () => {
    expect(shownRows(oneRowEach([counted("Dagger", 1), counted("dagger", 1)]))).toEqual([
      { name: "Dagger", count: 1 },
      { name: "dagger", count: 1 },
    ]);
  });

  it("says the total isn't known when one of the rows has no count", () => {
    const [row] = oneRowEach([counted("Dagger", 2), uncounted("Dagger")]);
    expect(row!.count.isKnown).toBe(false);
    expect(row!.count.explanation).toBe(A_ROW_HAS_NO_COUNT);
  });

  it("says the total isn't known when it goes over the most an item count can be", () => {
    const [row] = oneRowEach([counted("Arrow", 9_999), counted("Arrow", 1)]);
    expect(row!.count.isKnown).toBe(false);
  });

  it("says how many rows it added up", () => {
    const [row] = oneRowEach([counted("Dagger", 1), counted("Dagger", 1), counted("Dagger", 1)]);
    expect(row!.count.explanation).toBe("3 rows of it added up");
  });

  it("keeps the route the item came by", () => {
    const [row] = oneRowEach([counted("Dagger", 1), counted("Dagger", 1)]);
    expect(row!.count.route).toBe(PRINTED);
  });

  it("lists nothing for an empty inventory", () => {
    expect(oneRowEach([])).toEqual([]);
  });
});
