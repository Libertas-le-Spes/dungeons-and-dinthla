import { describe, expect, it } from "vitest";
import { MAX_NAME_BYTES } from "../../../src/pdf/limits/pdf-limits";
import { parsed, refusalFrom } from "../support/parsed";

describe("reading a name", () => {
  it("reads the letters after the slash", () => {
    expect(parsed("/Yes").asName()).toBe("Yes");
  });

  it("stops at whitespace and at a delimiter", () => {
    expect(parsed("/Yes ").asName()).toBe("Yes");
    expect(parsed("/Yes/No").asName()).toBe("Yes");
    expect(parsed("/Yes]").asName()).toBe("Yes");
  });

  it("reads an empty name", () => {
    expect(parsed("/ ").asName()).toBe("");
  });

  it("reads a #xx escape as the byte it names", () => {
    expect(parsed("/A#42C").asName()).toBe("ABC");
    expect(parsed("/Two#20Words").asName()).toBe("Two Words");
  });

  it("reads upper and lower case hex digits alike", () => {
    expect(parsed("/a#7a").asName()).toBe("az");
    expect(parsed("/a#7A").asName()).toBe("az");
  });

  it.each(["/A#", "/A#4", "/A#4G", "/A#G4", "/A#zz"])("refuses the broken escape in %s", (text) => {
    expect(refusalFrom(() => parsed(text))).toContain("A name in the file is not written");
  });

  it("refuses an escape of the byte zero", () => {
    expect(refusalFrom(() => parsed("/A#00B"))).toContain("A name in the file is not written");
  });

  it("reads a name of exactly the longest length", () => {
    expect(parsed(`/${"a".repeat(MAX_NAME_BYTES)}`).asName()).toBe("a".repeat(MAX_NAME_BYTES));
  });

  it("refuses a name one byte longer", () => {
    expect(refusalFrom(() => parsed(`/${"a".repeat(MAX_NAME_BYTES + 1)}`))).toContain("A name in the file is too long");
  });

  it("counts the bytes an escape stands for, not the characters that write it", () => {
    expect(parsed(`/${"#41".repeat(MAX_NAME_BYTES)}`).asName()).toBe("A".repeat(MAX_NAME_BYTES));
    expect(refusalFrom(() => parsed(`/${"#41".repeat(MAX_NAME_BYTES + 1)}`))).toContain("too long");
  });

  it("is not a string, a number or a dictionary", () => {
    const name = parsed("/Yes");
    expect(name.asText()).toBeNull();
    expect(name.asInteger()).toBeNull();
    expect(name.asDictionary()).toBeNull();
  });
});
