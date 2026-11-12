import { describe, expect, it } from "vitest";
import { PACT_SLOTS } from "../../../../../../src/beyond/rules/spells/slots/tables/pact-slots";

const ROWS = [
  { level: 1, count: 1, slotLevel: 1 },
  { level: 2, count: 2, slotLevel: 1 },
  { level: 3, count: 2, slotLevel: 2 },
  { level: 4, count: 2, slotLevel: 2 },
  { level: 5, count: 2, slotLevel: 3 },
  { level: 6, count: 2, slotLevel: 3 },
  { level: 7, count: 2, slotLevel: 4 },
  { level: 8, count: 2, slotLevel: 4 },
  { level: 9, count: 2, slotLevel: 5 },
  { level: 10, count: 2, slotLevel: 5 },
  { level: 11, count: 3, slotLevel: 5 },
  { level: 12, count: 3, slotLevel: 5 },
  { level: 13, count: 3, slotLevel: 5 },
  { level: 14, count: 3, slotLevel: 5 },
  { level: 15, count: 3, slotLevel: 5 },
  { level: 16, count: 3, slotLevel: 5 },
  { level: 17, count: 4, slotLevel: 5 },
  { level: 18, count: 4, slotLevel: 5 },
  { level: 19, count: 4, slotLevel: 5 },
  { level: 20, count: 4, slotLevel: 5 },
];

describe("PACT_SLOTS", () => {
  it.each(ROWS)("holds level $level as $count slots of level $slotLevel", (row) => {
    expect(PACT_SLOTS).toContainEqual(row);
  });

  it("holds exactly twenty levels", () => {
    expect(PACT_SLOTS).toHaveLength(20);
  });
});
