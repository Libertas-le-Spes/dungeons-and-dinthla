import { describe, expect, it } from "vitest";
import { nameOf, speciesOf } from "../../../../src/beyond/reply/parts/read-identity";
import { MadeUpReply } from "../../builders/made-up-reply";

describe("nameOf", () => {
  it("reads the name", () => {
    expect(nameOf(MadeUpReply.levelOneMonk().reader()).text).toBe("Primary Monk");
  });

  it("refuses a missing name", () => {
    expect(() => nameOf(MadeUpReply.levelOneMonk().without(["name"]).reader())).toThrow('"name" is missing or is not text');
  });

  it.each([5, null, true, ["Primary"], { name: "Primary" }])("refuses the name %j, which is not text", (value) => {
    expect(() => nameOf(MadeUpReply.levelOneMonk().with(["name"], value).reader())).toThrow("not text");
  });

  it("keeps the characters a note would escape, for the file name", () => {
    expect(nameOf(MadeUpReply.levelOneMonk().with(["name"], "Mira_Ash").reader()).text).toBe("Mira_Ash");
  });

  it("removes tags and hidden characters", () => {
    expect(nameOf(MadeUpReply.levelOneMonk().with(["name"], "<b>Mira</b>\u200b Ash").reader()).text).toBe("Mira Ash");
  });

  it("refuses a name with a line break", () => {
    expect(() => nameOf(MadeUpReply.levelOneMonk().with(["name"], "Mira\nAsh").reader())).toThrow("holds a line break");
  });

  it("refuses a name over the name cap", () => {
    expect(() => nameOf(MadeUpReply.levelOneMonk().with(["name"], "a".repeat(101)).reader())).toThrow("over the limit");
  });
});

describe("speciesOf", () => {
  it("reads the species from the full name of the race", () => {
    expect(speciesOf(MadeUpReply.levelOneMonk().with(["race", "fullName"], "Pale Moon Elf").reader()).text).toBe("Pale Moon Elf");
  });

  it("keeps the characters a note would escape, for the file name", () => {
    expect(speciesOf(MadeUpReply.levelOneMonk().with(["race", "fullName"], "[[Secondary]]").reader()).text).toBe("[[Secondary]]");
  });

  it("removes tags from the species", () => {
    expect(speciesOf(MadeUpReply.levelOneMonk().with(["race", "fullName"], "<i>Pale</i> Elf").reader()).text).toBe("Pale Elf");
  });

  it("refuses a species over the name cap", () => {
    expect(() => speciesOf(MadeUpReply.levelOneMonk().with(["race", "fullName"], "a".repeat(101)).reader())).toThrow("A name is over the limit of 100 characters.");
  });

  it("refuses a species with a line break", () => {
    expect(() => speciesOf(MadeUpReply.levelOneMonk().with(["race", "fullName"], "Pale\nElf").reader())).toThrow("holds a line break");
  });

  it("refuses a species with no text in it", () => {
    expect(() => speciesOf(MadeUpReply.levelOneMonk().with(["race", "fullName"], "<i></i>").reader())).toThrow("A name has no text in it.");
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
