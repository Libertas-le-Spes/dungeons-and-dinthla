import { describe, expect, it } from "vitest";
import { importedSessionOf } from "../../../src/characters/imported/reading/imported-session";
import { STUB_SYNTAX } from "../../host/stub-syntax";

describe("importedSessionOf", () => {
  it("reads the session from the properties", () => {
    expect(importedSessionOf("---\nimported-session: 12\n---\nBody\n", STUB_SYNTAX)).toBe(12);
  });

  it("reads 0", () => {
    expect(importedSessionOf("---\nimported-session: 0\n---\n", STUB_SYNTAX)).toBe(0);
  });

  it("reads Windows line breaks", () => {
    expect(importedSessionOf("---\r\nimported-session: 4\r\n---\r\n", STUB_SYNTAX)).toBe(4);
  });

  it("reads nothing from a note that never recorded one", () => {
    expect(importedSessionOf("---\nimported: 2026-11-13\n---\n", STUB_SYNTAX)).toBeNull();
  });

  it("reads nothing from a value that is not a whole number", () => {
    expect(importedSessionOf("---\nimported-session: three\n---\n", STUB_SYNTAX)).toBeNull();
    expect(importedSessionOf("---\nimported-session: -1\n---\n", STUB_SYNTAX)).toBeNull();
  });

  it("reads nothing from the same line in the body", () => {
    expect(importedSessionOf("---\nmood: calm\n---\nimported-session: 5\n", STUB_SYNTAX)).toBeNull();
  });
});
