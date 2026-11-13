import { describe, expect, it } from "vitest";
import { HALF_SLOTS } from "../../../../../../src/beyond/rules/spells/slots/tables/half-slots";

const ROWS = [
  { level: 1, slots: [] },
  { level: 2, slots: [2] },
  { level: 3, slots: [3] },
  { level: 4, slots: [3] },
  { level: 5, slots: [4, 2] },
  { level: 6, slots: [4, 2] },
  { level: 7, slots: [4, 3] },
  { level: 8, slots: [4, 3] },
  { level: 9, slots: [4, 3, 2] },
  { level: 10, slots: [4, 3, 2] },
  { level: 11, slots: [4, 3, 3] },
  { level: 12, slots: [4, 3, 3] },
  { level: 13, slots: [4, 3, 3, 1] },
  { level: 14, slots: [4, 3, 3, 1] },
  { level: 15, slots: [4, 3, 3, 2] },
  { level: 16, slots: [4, 3, 3, 2] },
  { level: 17, slots: [4, 3, 3, 3, 1] },
  { level: 18, slots: [4, 3, 3, 3, 1] },
  { level: 19, slots: [4, 3, 3, 3, 2] },
  { level: 20, slots: [4, 3, 3, 3, 2] },
];

describe("HALF_SLOTS", () => {
  it.each(ROWS)("holds level $level as $slots", ({ level, slots }) => {
    expect(HALF_SLOTS.slotsAt(level)).toEqual(slots);
  });

  it("holds exactly twenty levels, and nothing for level 21", () => {
    expect([ROWS.length, HALF_SLOTS.slotsAt(21)]).toEqual([20, undefined]);
  });

  it("holds no slots below level 1, and not as a missing level", () => {
    expect([HALF_SLOTS.slotsAt(0), HALF_SLOTS.slotsAt(-1)]).toEqual([[], []]);
  });
});
