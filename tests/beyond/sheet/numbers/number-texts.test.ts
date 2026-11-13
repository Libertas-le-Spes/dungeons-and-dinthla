import { describe, expect, it } from "vitest";
import { FEET, SIGNED, WHOLE } from "../../../../src/beyond/sheet/numbers/number-texts";

describe("the text of a whole number", () => {
  it("reads digits", () => {
    expect(WHOLE.numberIn("12")).toBe(12);
  });

  it.each(["+12", "-1", "1e3", "12 ft", "1.5", "", "٣", "0x10", "1e999"])("refuses %j", (text) => {
    expect(WHOLE.numberIn(text)).toBeNull();
  });
});

describe("the text of a signed number", () => {
  it.each([
    ["+2", 2],
    ["-2", -2],
    ["2", 2],
  ])("reads %j", (text, expected) => {
    expect(SIGNED.numberIn(text)).toBe(expected);
  });

  it.each(["--2", "+-2", "−2", "2+", "1e999", "", "+", "two"])("refuses %j", (text) => {
    expect(SIGNED.numberIn(text)).toBeNull();
  });

  it("keeps a negative zero, so the range check can refuse it", () => {
    expect(Object.is(SIGNED.numberIn("-0"), -0)).toBe(true);
  });
});

describe("the text of a walking speed", () => {
  it.each(["30 ft. (walking)", "30ft walking", "30 FT. (WALKING)", "30 ft (walking)", "30 ft.(walking)", "30 ft. walking"])("reads %j", (text) => {
    expect(FEET.numberIn(text)).toBe(30);
  });

  it.each(["30", "30 ft.", "30 ft., fly 60 ft.", "30 ft. (walking", "30 ft. walking)", "30 ft. ((walking))", "30 ft. (walking))", "30 ft. (walking) 40", "-30 ft. (walking)", "ft. (walking)", "30 miles (walking)"])("refuses %j", (text) => {
    expect(FEET.numberIn(text)).toBeNull();
  });
});
