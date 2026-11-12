import { describe, expect, it } from "vitest";
import { skipSpace, skipWhitespace } from "../../../src/pdf/bytes/skip-space";
import { cursorOver } from "../support/cursors";

describe("skipSpace", () => {
  it("skips every kind of whitespace", () => {
    const cursor = cursorOver(" \t\r\n\f\0x");
    skipSpace(cursor);
    expect(cursor.position()).toBe(6);
  });

  it("skips a comment to the end of its line and the whitespace after it", () => {
    const cursor = cursorOver("  % a comment (with a bracket [\n  x");
    skipSpace(cursor);
    expect(cursor.current()).toBe("x".charCodeAt(0));
  });

  it("skips a comment that ends at a carriage return", () => {
    const cursor = cursorOver("%c\rx");
    skipSpace(cursor);
    expect(cursor.current()).toBe("x".charCodeAt(0));
  });

  it("skips several comments in a row", () => {
    const cursor = cursorOver("%a\n%b\n%c\nx");
    skipSpace(cursor);
    expect(cursor.current()).toBe("x".charCodeAt(0));
  });

  it("stops at the end of the file inside a comment", () => {
    const cursor = cursorOver("% never ends");
    skipSpace(cursor);
    expect(cursor.isAtEnd()).toBe(true);
  });

  it("does not move when there is nothing to skip", () => {
    const cursor = cursorOver("x");
    skipSpace(cursor);
    expect(cursor.position()).toBe(0);
  });
});

describe("skipWhitespace", () => {
  it("skips whitespace but leaves a comment", () => {
    const cursor = cursorOver("  %c\nx");
    skipWhitespace(cursor);
    expect(cursor.current()).toBe("%".charCodeAt(0));
  });
});
