import { describe, expect, it } from "vitest";
import { featuresOf } from "../../../../src/beyond/reply/parts/read-features";
import { MadeUpReply } from "../../builders/made-up-reply";

function feat(name: unknown): object {
  return { definition: { name } };
}

describe("featuresOf", () => {
  it("reads the name of each feat", () => {
    expect(featuresOf(MadeUpReply.levelOneMonk().with(["feats"], [feat("Alert"), feat("Tough")]).reader())).toEqual(["Alert", "Tough"]);
  });

  it("reads no feats", () => {
    expect(featuresOf(MadeUpReply.levelOneMonk().with(["feats"], []).reader())).toEqual([]);
  });

  it("refuses missing feats", () => {
    expect(() => featuresOf(MadeUpReply.levelOneMonk().without(["feats"]).reader())).toThrow('"feats" is missing or is not a list');
  });

  it.each([null, {}, "Alert", 5])("refuses feats given as %j", (value) => {
    expect(() => featuresOf(MadeUpReply.levelOneMonk().with(["feats"], value).reader())).toThrow("not a list");
  });

  it("refuses a feat with no name", () => {
    expect(() => featuresOf(MadeUpReply.levelOneMonk().with(["feats"], [{ definition: {} }]).reader())).toThrow('"name" is missing');
    expect(() => featuresOf(MadeUpReply.levelOneMonk().with(["feats"], [feat(3)]).reader())).toThrow("not text");
  });

  it("makes a feat name inert for a note", () => {
    expect(featuresOf(MadeUpReply.levelOneMonk().with(["feats"], [feat("# Alert")]).reader())).toEqual(["\\# Alert"]);
  });

  it("takes 500 feats and refuses 501", () => {
    expect(featuresOf(MadeUpReply.levelOneMonk().with(["feats"], Array(500).fill(feat("Alert"))).reader())).toHaveLength(500);
    expect(() => featuresOf(MadeUpReply.levelOneMonk().with(["feats"], Array(501).fill(feat("Alert"))).reader())).toThrow("The list of features is over the limit of 500 features.");
  });
});
