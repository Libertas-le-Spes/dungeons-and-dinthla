import { describe, expect, it } from "vitest";
import { hitPointInputsOf } from "../../../../src/beyond/reply/rule-input/body/read-hit-points";
import { MadeUpReply } from "../../builders/made-up-reply";

function inputsOf(reply: MadeUpReply) {
  return hitPointInputsOf(reply.reader());
}

describe("hitPointInputsOf", () => {
  it("takes the dice total, the bonus, the hit points lost and the temporary hit points", () => {
    const reply = MadeUpReply.levelOneMonk().with(["bonusHitPoints"], 3).with(["removedHitPoints"], 4).with(["temporaryHitPoints"], 5);
    expect(inputsOf(reply)).toMatchObject({ base: 12, bonus: 3, override: null, removed: 4, temporary: 5, doubts: [] });
  });

  it("takes a null bonus as no bonus", () => {
    expect(inputsOf(MadeUpReply.levelOneMonk()).bonus).toBe(0);
  });

  it("leaves a missing bonus out, so the engine says it is missing", () => {
    expect(inputsOf(MadeUpReply.levelOneMonk().without(["bonusHitPoints"])).bonus).toBeNull();
  });

  it("leaves a bonus of the wrong type out", () => {
    expect(inputsOf(MadeUpReply.levelOneMonk().with(["bonusHitPoints"], "3")).bonus).toBeNull();
  });

  it("takes the override D&D Beyond holds", () => {
    expect(inputsOf(MadeUpReply.levelOneMonk().with(["overrideHitPoints"], 20))).toMatchObject({ override: 20, base: 12, doubts: [] });
  });

  it.each([null, undefined])("takes an override of %j as none", (value) => {
    expect(inputsOf(MadeUpReply.levelOneMonk().with(["overrideHitPoints"], value))).toMatchObject({ override: null, doubts: [] });
  });

  it.each(["14", true, [14], { value: 14 }, {}, false])("doubts the hit points, and drops the dice total, when the override is %j", (value) => {
    const found = inputsOf(MadeUpReply.levelOneMonk().with(["overrideHitPoints"], value));
    expect(found.base).toBeNull();
    expect(found.doubts.map((doubt) => [doubt.name, doubt.value.isKnown, doubt.value.explanation])).toEqual([["HP", false, "D&D Beyond gave the hit points set by hand in an unexpected form."]]);
  });

  it("leaves the hit points lost and the temporary hit points out when they are missing", () => {
    const found = inputsOf(MadeUpReply.levelOneMonk().without(["removedHitPoints"]).without(["temporaryHitPoints"]));
    expect([found.removed, found.temporary]).toEqual([null, null]);
  });
});
