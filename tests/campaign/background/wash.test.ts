import { describe, expect, it } from "vitest";
import { washOf } from "../../../src/campaign/background/wash";

describe("washOf", () => {
  it.each(["subtle", "balanced", "strong"])("reads %s as itself", (wash) => {
    expect(washOf(wash)).toBe(wash);
  });

  it.each(["Strong", "bold", 3, null, undefined])("reads %s as balanced", (value) => {
    expect(washOf(value)).toBe("balanced");
  });
});
