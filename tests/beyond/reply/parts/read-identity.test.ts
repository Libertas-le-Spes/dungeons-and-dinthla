import { describe, expect, it } from "vitest";
import { nameOf, speciesOf } from "../../../../src/beyond/reply/parts/read-identity";
import { MadeUpReply } from "../../builders/made-up-reply";

describe("nameOf", () => {
  it("reads the name", () => {
    expect(nameOf(MadeUpReply.levelOneMonk().reader())).toBe("Primary Monk");
  });

  it("refuses a missing name", () => {
    expect(() => nameOf(MadeUpReply.levelOneMonk().without(["name"]).reader())).toThrow('"name" is missing or is not text');
  });

  it.each([5, null, true, ["Primary"], { name: "Primary" }])("refuses the name %j, which is not text", (value) => {
    expect(() => nameOf(MadeUpReply.levelOneMonk().with(["name"], value).reader())).toThrow("not text");
  });

  it("makes the name inert for a note", () => {
    expect(nameOf(MadeUpReply.levelOneMonk().with(["name"], "[[Secondary]]").reader())).toBe("\\[\\[Secondary\\]\\]");
  });

  it("refuses a name over the name cap", () => {
    expect(() => nameOf(MadeUpReply.levelOneMonk().with(["name"], "a".repeat(101)).reader())).toThrow("over the limit");
  });
});

describe("speciesOf", () => {
  it("reads the species from the full name of the race", () => {
    expect(speciesOf(MadeUpReply.levelOneMonk().with(["race", "fullName"], "Pale Moon Elf").reader())).toBe("Pale Moon Elf");
  });

  it("refuses a missing race", () => {
    expect(() => speciesOf(MadeUpReply.levelOneMonk().without(["race"]).reader())).toThrow('"race" is missing or is not an object');
  });

  it("refuses a race given as a list", () => {
    expect(() => speciesOf(MadeUpReply.levelOneMonk().with(["race"], [{ fullName: "Human" }]).reader())).toThrow("not an object");
  });

  it("refuses a missing full name", () => {
    expect(() => speciesOf(MadeUpReply.levelOneMonk().without(["race", "fullName"]).reader())).toThrow('"fullName" is missing or is not text');
  });

  it("refuses a full name that is not text", () => {
    expect(() => speciesOf(MadeUpReply.levelOneMonk().with(["race", "fullName"], 7).reader())).toThrow("not text");
  });
});
