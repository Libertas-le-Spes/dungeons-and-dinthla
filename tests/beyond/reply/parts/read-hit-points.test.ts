import { describe, expect, it } from "vitest";
import { hitPointsOf } from "../../../../src/beyond/reply/parts/read-hit-points";
import { MadeUpReply } from "../../builders/made-up-reply";

describe("hitPointsOf", () => {
  it("takes the override D&D Beyond holds, with the working", () => {
    const found = hitPointsOf(MadeUpReply.levelOneMonk().with(["overrideHitPoints"], 14).reader());
    expect(found.valueOr(0)).toBe(14);
    expect(found.explanation).toBe("Hit points set on D&D Beyond: 14");
    expect(found.route.name).toBe("online");
  });

  it("does not state hit points from the dice total, which lacks the constitution bonus", () => {
    const found = hitPointsOf(MadeUpReply.levelOneMonk().with(["baseHitPoints"], 12).reader());
    expect(found.isKnown).toBe(false);
    expect(found.explanation).toContain("does not state maximum hit points");
  });

  it.each([null, undefined])("marks an override of %j not known, saying hit points are not stated", (value) => {
    const found = hitPointsOf(MadeUpReply.levelOneMonk().with(["overrideHitPoints"], value).reader());
    expect(found.isKnown).toBe(false);
    expect(found.explanation).toContain("does not state maximum hit points");
  });

  it.each(["14", "5", true, [14], { value: 14 }, {}, false])("marks the override %j not known, saying it came in an unexpected form", (value) => {
    const found = hitPointsOf(MadeUpReply.levelOneMonk().with(["overrideHitPoints"], value).reader());
    expect(found.isKnown).toBe(false);
    expect(found.explanation).toBe("D&D Beyond gave the hit points set by hand in an unexpected form.");
  });

  it("marks a missing override not known, saying hit points are not stated", () => {
    const found = hitPointsOf(MadeUpReply.levelOneMonk().without(["overrideHitPoints"]).reader());
    expect(found.explanation).toContain("does not state maximum hit points");
  });

  it("marks a fractional override not known, saying the range", () => {
    const found = hitPointsOf(MadeUpReply.levelOneMonk().with(["overrideHitPoints"], 12.5).reader());
    expect(found.explanation).toBe("Maximum hit points has to be a whole number from 1 to 9999.");
  });

  it.each([-1, 0, 10_000])("marks the override %i outside the range not known, saying the range", (value) => {
    const found = hitPointsOf(MadeUpReply.levelOneMonk().with(["overrideHitPoints"], value).reader());
    expect(found.isKnown).toBe(false);
    expect(found.explanation).toBe("Maximum hit points has to be a whole number from 1 to 9999.");
  });
});
