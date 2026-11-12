import { describe, expect, it } from "vitest";
import { refuseAbove } from "../../../src/beyond/shape/refuse-above";
import { Refusal } from "../../../src/beyond/shape/refusal";

const CAP = { what: "The pile", most: 3, unit: "stones" };

describe("refuseAbove", () => {
  it("takes a size of nothing", () => {
    expect(() => refuseAbove(CAP, 0)).not.toThrow();
  });

  it("takes a size exactly at the cap", () => {
    expect(() => refuseAbove(CAP, 3)).not.toThrow();
  });

  it("refuses a size one over the cap, in plain words", () => {
    expect(() => refuseAbove(CAP, 4)).toThrow(new Refusal("The pile is over the limit of 3 stones."));
  });

  it("refuses with a Refusal", () => {
    expect(() => refuseAbove(CAP, 4)).toThrow(Refusal);
  });
});
