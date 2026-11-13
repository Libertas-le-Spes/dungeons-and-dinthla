import { describe, expect, it } from "vitest";
import { LineEnding, plainLineOf } from "../../../../src/imports/note/reading/line-ending";

describe("plainLineOf", () => {
  it("takes the return off a line", () => {
    expect(plainLineOf("a\r")).toBe("a");
  });

  it("leaves a line with no return as it is", () => {
    expect(plainLineOf("ab")).toBe("ab");
  });

  it("takes only the final return", () => {
    expect(plainLineOf("a\r\r")).toBe("a\r");
  });
});

describe("LineEnding", () => {
  it("ends a new line with a return when the text has a Windows line break", () => {
    expect(LineEnding.of("a\r\nb").ends("x")).toBe("x\r");
  });

  it("leaves a new line as it is when the text has none", () => {
    expect(LineEnding.of("a\nb").ends("x")).toBe("x");
  });

  it("leaves a new line as it is when the text has only a return", () => {
    expect(LineEnding.of("a\rb").ends("x")).toBe("x");
  });
});
