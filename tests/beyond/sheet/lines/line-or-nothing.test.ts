import { describe, expect, it } from "vitest";
import { lineOrNothing } from "../../../../src/beyond/sheet/lines/line-or-nothing";

describe("a line from the sheet that may be unusable", () => {
  it("is the clean line when the text is usable", () => {
    expect(lineOrNothing("Primary Staff")?.text).toBe("Primary Staff");
  });

  it("has its markup taken out", () => {
    expect(lineOrNothing("Primary <b>Staff</b>")?.text).toBe("Primary Staff");
  });

  it.each(["", "   ", "<i></i>", "two\nlines", "x".repeat(101)])("is nothing for %j", (text) => {
    expect(lineOrNothing(text)).toBeNull();
  });

  it("is a line at exactly the longest a name may be", () => {
    expect(lineOrNothing("x".repeat(100))?.text).toBe("x".repeat(100));
  });
});
