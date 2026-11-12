import { describe, expect, it } from "vitest";
import { withoutFactStart, withoutMarkerStart } from "../../../src/beyond/text/line-start-guard";

const ASCII_PUNCTUATION = Array.from("!\"#$%&'()*+,-./:;<=>?@[]^_`{|}~");

describe("withoutFactStart", () => {
  it("escapes the colon of a line that starts with a name and a colon", () => {
    expect(withoutFactStart("Range: 60 feet")).toBe("Range\\: 60 feet");
  });

  it("escapes the colon of a name of several words", () => {
    expect(withoutFactStart("Armor Class: 16")).toBe("Armor Class\\: 16");
  });

  it("escapes the colon of a name with a space before it", () => {
    expect(withoutFactStart("AC : 16")).toBe("AC \\: 16");
  });

  it("escapes the colon of a name with accents", () => {
    expect(withoutFactStart("Écu: 3")).toBe("Écu\\: 3");
  });

  it("escapes only the first colon", () => {
    expect(withoutFactStart("Range: 60: feet")).toBe("Range\\: 60: feet");
  });

  it("leaves a line whose first words hold a comma or a digit", () => {
    expect(withoutFactStart("see Mira, AC: 15")).toBe("see Mira, AC: 15");
    expect(withoutFactStart("5 ft: line")).toBe("5 ft: line");
  });

  it("leaves a line with no colon", () => {
    expect(withoutFactStart("Range 60 feet")).toBe("Range 60 feet");
  });
});

describe("withoutMarkerStart", () => {
  it.each(ASCII_PUNCTUATION)("puts a backslash before a line starting with %s", (symbol) => {
    expect(withoutMarkerStart(`${symbol}x`)).toBe(`\\${symbol}x`);
  });

  it("leaves a line that starts with a backslash", () => {
    expect(withoutMarkerStart("\\? x")).toBe("\\? x");
  });

  it.each(["x", "7", "Écu", "\u2014 dash", "\uff1f wide", "\u{1f319} moon", " space"])("leaves the line %j, which starts with no ASCII punctuation", (line) => {
    expect(withoutMarkerStart(line)).toBe(line);
  });

  it("leaves an empty line", () => {
    expect(withoutMarkerStart("")).toBe("");
  });
});
