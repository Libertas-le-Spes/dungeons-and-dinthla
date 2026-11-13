import { describe, expect, it } from "vitest";
import { leftAsTheyWere } from "../../../src/funds/tracking/left-as-they-were";

describe("the items of the same name left after tracking", () => {
  it("are as they were when only the tracked one is missing from them", () => {
    expect(leftAsTheyWere(["Rope _x sold"], ["Rope \\_x lost", "Rope _x sold"])).toBe(true);
  });

  it("are as they were when nothing of that name was there before", () => {
    expect(leftAsTheyWere([], [])).toBe(true);
  });

  it("aren't when a second record of that name would be gone", () => {
    expect(leftAsTheyWere([], ["Rope \\_x lost", "Rope _x sold"])).toBe(false);
  });

  it("aren't when a record of that name would be altered", () => {
    expect(leftAsTheyWere(["Rope _x lost"], ["Rope \\_x lost", "Rope _x sold"])).toBe(false);
  });
});
