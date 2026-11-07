import { describe, expect, it } from "vitest";
import { formatMoney } from "../../src/notes/money";

describe("formatMoney", () => {
  it("writes copper as gold, silver and copper", () => {
    expect(formatMoney(3540)).toBe("35 gp 4 sp");
    expect(formatMoney(123456)).toBe("1,234 gp 5 sp 6 cp");
  });

  it("writes money out with a minus sign", () => {
    expect(formatMoney(-1200)).toBe("−12 gp");
  });

  it("writes nothing as 0 gp", () => {
    expect(formatMoney(0)).toBe("0 gp");
  });
});
