import { describe, expect, it } from "vitest";
import { partsBetweenCommas } from "../../src/notes/comma";

describe("partsBetweenCommas", () => {
  it("splits a line at its commas", () => {
    expect(partsBetweenCommas("paid 5 gp, got 3 gp back")).toEqual(["paid 5 gp", " got 3 gp back"]);
  });

  it("keeps thousands and linked names whole", () => {
    expect(partsBetweenCommas("1,200 gp from [[Vess, Lady]]")).toEqual(["1,200 gp from [[Vess, Lady]]"]);
  });

  it("leaves out empty parts", () => {
    expect(partsBetweenCommas(",,a,")).toEqual(["a"]);
  });
});
