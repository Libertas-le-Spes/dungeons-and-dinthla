import { describe, expect, it } from "vitest";
import { reasonedWorking, sumWorking, withConditional } from "../../../../src/beyond/rules/core/working-text";

describe("working text", () => {
  it("joins the terms with a plus and ends with the total", () => {
    expect(sumWorking(["10", "DEX 4", "WIS 2"], 16)).toBe("10 + DEX 4 + WIS 2 = 16");
  });

  it("adds the reason after the total", () => {
    expect(reasonedWorking(["10", "DEX 4", "WIS 2"], 16, "monk's unarmoured defence")).toBe("10 + DEX 4 + WIS 2 = 16, monk's unarmoured defence");
  });

  it("adds nothing when no bonus is conditional", () => {
    expect(withConditional("10 = 10", [])).toBe("10 = 10");
  });

  it("names every conditional bonus it does not apply", () => {
    expect(withConditional("10 = 10", ["Dual Wielder", "Bladesong"])).toBe("10 = 10. Not applied: Dual Wielder, Bladesong");
  });
});
