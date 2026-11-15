import { describe, expect, it } from "vitest";
import { speedInputsOf } from "../../../../../src/beyond/reply/rule-input/body/read-walking-speed";
import { MadeUpReply } from "../../../builders/made-up-reply";

describe("speedInputsOf", () => {
  it("takes the walking speed", () => {
    expect(speedInputsOf(MadeUpReply.levelOneMonk().reader())).toEqual({ walking: 30, doubts: [] });
  });

  it("holds no walking speed when the reply gives no speeds, and raises no doubt", () => {
    expect(speedInputsOf(MadeUpReply.levelOneMonk().with(["race", "weightSpeeds"], null).reader())).toEqual({ walking: null, doubts: [] });
  });

  it("holds no walking speed when the speeds have no normal speed", () => {
    expect(speedInputsOf(MadeUpReply.levelOneMonk().with(["race", "weightSpeeds"], { override: null }).reader())).toEqual({ walking: null, doubts: [] });
  });

  it("holds no walking speed when it is not a number", () => {
    expect(speedInputsOf(MadeUpReply.levelOneMonk().with(["race", "weightSpeeds", "normal", "walk"], "30").reader()).walking).toBeNull();
  });

  it("doubts the speed when one is set by hand on the race's speeds", () => {
    const found = speedInputsOf(MadeUpReply.levelOneMonk().with(["race", "weightSpeeds", "override"], { walk: 50 }).reader());
    expect(found.walking).toBe(30);
    expect(found.doubts.map((doubt) => [doubt.name, doubt.value.isKnown, doubt.value.explanation])).toEqual([
      ["Speed", false, "Speed set by hand. Type it on your note."],
    ]);
  });

  it("doubts the speed when custom speeds are listed", () => {
    expect(speedInputsOf(MadeUpReply.levelOneMonk().with(["customSpeeds"], [{ movementId: 1, distance: 40 }]).reader()).doubts.map((doubt) => doubt.name)).toEqual(["Speed"]);
  });

  it("raises no doubt when the reply lists no custom speeds at all", () => {
    expect(speedInputsOf(MadeUpReply.levelOneMonk().without(["customSpeeds"]).reader()).doubts).toEqual([]);
  });

  it("raises no doubt for custom speeds when the race gives no speeds", () => {
    expect(speedInputsOf(MadeUpReply.levelOneMonk().with(["race", "weightSpeeds"], null).reader()).doubts).toEqual([]);
  });

  it("refuses more custom speeds than the limit", () => {
    expect(() => speedInputsOf(MadeUpReply.levelOneMonk().with(["customSpeeds"], Array(21).fill({})).reader())).toThrow("The list of speeds set by hand is over the limit");
  });
});
