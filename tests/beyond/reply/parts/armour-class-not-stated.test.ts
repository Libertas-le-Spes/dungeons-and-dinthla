import { describe, expect, it } from "vitest";
import { armourClassNotStated } from "../../../../src/beyond/reply/parts/armour-class-not-stated";

describe("armourClassNotStated", () => {
  it("gives a value that is not known, saying D&D Beyond does not state it", () => {
    const found = armourClassNotStated();
    expect(found.isKnown).toBe(false);
    expect(found.explanation).toContain("does not state armor class");
    expect(found.route.name).toBe("online");
  });
});
