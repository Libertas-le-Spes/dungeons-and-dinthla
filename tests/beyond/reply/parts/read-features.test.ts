import { describe, expect, it } from "vitest";
import { featuresOf } from "../../../../src/beyond/reply/parts/read-features";
import type { CleanLine } from "../../../../src/beyond/text/clean-line";
import { MadeUpReply } from "../../builders/made-up-reply";

function textsOf(lines: readonly CleanLine[]): string[] {
  return lines.map((line) => line.text);
}

function feat(name: unknown): object {
  return { definition: { name } };
}

function distinct(count: number): object[] {
  return Array.from({ length: count }, (_, index) => feat(`Feat ${index}`));
}

function plain(): MadeUpReply {
  return MadeUpReply.levelOneMonk().with(["race", "racialTraits"], []).with(["classes", 0, "classFeatures"], []);
}

describe("featuresOf", () => {
  it("lists the feats, the racial traits and the class features reached, once each", () => {
    const reply = MadeUpReply.levelOneMonk().with(["feats"], [feat("Alert"), feat("Quick Learner")]);
    expect(textsOf(featuresOf(reply.reader()))).toEqual(["Alert", "Quick Learner", "Unarmored Defense"]);
  });

  it("reads the name of each feat", () => {
    expect(textsOf(featuresOf(plain().with(["feats"], [feat("Alert"), feat("Tough")]).reader()))).toEqual(["Alert", "Tough"]);
  });

  it("reads no feats", () => {
    expect(featuresOf(plain().with(["feats"], []).reader())).toEqual([]);
  });

  it("refuses missing feats", () => {
    expect(() => featuresOf(plain().without(["feats"]).reader())).toThrow('"feats" is missing or is not a list');
  });

  it.each([null, {}, "Alert", 5])("refuses feats given as %j", (value) => {
    expect(() => featuresOf(plain().with(["feats"], value).reader())).toThrow("not a list");
  });

  it("refuses a feat with no name", () => {
    expect(() => featuresOf(plain().with(["feats"], [{ definition: {} }]).reader())).toThrow('"name" is missing');
    expect(() => featuresOf(plain().with(["feats"], [feat(3)]).reader())).toThrow("not text");
  });

  it("keeps the characters a note would escape in a feat name, for the file name", () => {
    expect(textsOf(featuresOf(plain().with(["feats"], [feat("# Alert")]).reader()))).toEqual(["# Alert"]);
  });

  it("takes 500 feats and refuses 501", () => {
    expect(featuresOf(plain().with(["feats"], distinct(500)).reader())).toHaveLength(500);
    expect(() => featuresOf(plain().with(["feats"], distinct(501)).reader())).toThrow("The list of features is over the limit of 500 features.");
  });
});
