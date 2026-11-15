import { describe, expect, it } from "vitest";
import { ruleFeaturesOf } from "../../../../../src/beyond/reply/rule-input/features/read-rule-features";
import { MadeUpReply } from "../../../builders/made-up-reply";

interface FeatureFields {
  readonly id: number;
  readonly name: string;
  readonly requiredLevel: unknown;
}

function featureOf(fields: FeatureFields): Record<string, unknown> {
  return { definition: fields };
}

describe("ruleFeaturesOf", () => {
  it("lists the feats, the racial traits and the class features the level has reached, in that order", () => {
    expect(ruleFeaturesOf(MadeUpReply.levelOneMonk().reader())).toEqual(["Alert", "Quick Learner", "Unarmored Defense"]);
  });

  it("lists a class feature when the level reaches it, and not before", () => {
    const reply = MadeUpReply.levelOneMonk().with(["classes", 0, "level"], 2);
    expect(ruleFeaturesOf(reply.reader())).toEqual(["Alert", "Quick Learner", "Unarmored Defense", "Unarmored Movement"]);
  });

  it("lists the features of a subclass the level has reached, which the class lists with the rest", () => {
    const features = [featureOf({ id: 950, name: "Open Hand Technique", requiredLevel: 3 }), featureOf({ id: 951, name: "Wholeness of Body", requiredLevel: 6 })];
    const reply = MadeUpReply.levelOneMonk().with(["classes", 0, "level"], 3).with(["classes", 0, "classFeatures"], features);
    expect(ruleFeaturesOf(reply.reader())).toContain("Open Hand Technique");
    expect(ruleFeaturesOf(reply.reader())).not.toContain("Wholeness of Body");
  });

  it("does not read the features a subclass definition repeats, which carry no definition of their own", () => {
    const repeated = { name: "Open Hand", classFeatures: [{ id: 950, name: "Open Hand Technique", requiredLevel: 3 }] };
    const reply = MadeUpReply.levelOneMonk().with(["classes", 0, "level"], 3).with(["classes", 0, "subclassDefinition"], repeated);
    expect(ruleFeaturesOf(reply.reader())).not.toContain("Open Hand Technique");
  });

  it("leaves a class feature out when its level is not a number", () => {
    const reply = MadeUpReply.levelOneMonk().with(["classes", 0, "classFeatures"], [featureOf({ id: 1, name: "Odd Feature", requiredLevel: "1" })]);
    expect(ruleFeaturesOf(reply.reader())).not.toContain("Odd Feature");
  });

  it("leaves class features out when the class level is not a number", () => {
    const reply = MadeUpReply.levelOneMonk().with(["classes", 0, "level"], "1");
    expect(ruleFeaturesOf(reply.reader())).toEqual(["Alert", "Quick Learner"]);
  });

  it("lists the options from every source that holds a list", () => {
    const options = { race: [{ definition: { name: "Tough Hide" } }], class: [{ definition: { name: "Defense" } }], background: null, item: null, feat: [{ definition: { name: "Fey Touch" } }] };
    const reply = MadeUpReply.levelOneMonk().with(["options"], options);
    expect(ruleFeaturesOf(reply.reader()).slice(-3)).toEqual(["Tough Hide", "Defense", "Fey Touch"]);
  });

  it("reads a race that lists no traits and a class that lists no features", () => {
    const reply = MadeUpReply.levelOneMonk().without(["race", "racialTraits"]).without(["classes", 0, "classFeatures"]);
    expect(ruleFeaturesOf(reply.reader())).toEqual(["Alert"]);
  });

  it("refuses missing options", () => {
    expect(() => ruleFeaturesOf(MadeUpReply.levelOneMonk().without(["options"]).reader())).toThrow('"options" is missing or is not an object');
  });
});
