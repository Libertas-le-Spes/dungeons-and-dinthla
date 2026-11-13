import { describe, expect, it } from "vitest";
import { limitedList } from "../../../src/beyond/shape/limited-list";
import { Refusal } from "../../../src/beyond/shape/refusal";

const CAP = { what: "The pile", most: 2, unit: "stones" };

describe("limitedList", () => {
  it("hands back a list exactly at the cap unchanged", () => {
    const list = ["Mira", "Baka"];
    expect(limitedList(list, CAP)).toBe(list);
  });

  it("refuses a list one over the cap, and does not cut it down", () => {
    expect(() => limitedList(["Mira", "Baka", "Pale Moon"], CAP)).toThrow(Refusal);
  });
});
