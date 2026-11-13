import { describe, expect, it } from "vitest";
import { hasLetterOrDigit } from "../../../../src/beyond/sheet/lines/letter-or-digit";

describe("a text with a letter or a digit in it", () => {
  it.each(["Monk", "7", "- x -", "é", "٣"])("is %j", (text) => {
    expect(hasLetterOrDigit(text)).toBe(true);
  });

  it.each(["", " ", "⠀", "́", "-- ** --", "​"])("is not %j", (text) => {
    expect(hasLetterOrDigit(text)).toBe(false);
  });
});
