import { describe, expect, it } from "vitest";
import { numbersOf } from "../../../../src/beyond/reply/parts/read-numbers";
import { MadeUpReply } from "../../builders/made-up-reply";

describe("numbersOf", () => {
  it("lists armor class then hit points, by the names the sheet reads", () => {
    expect(numbersOf(MadeUpReply.levelOneMonk().reader()).map((number) => number.name)).toEqual(["AC", "HP"]);
  });

  it("marks armor class not known even when the reply claims one", () => {
    const reply = MadeUpReply.levelOneMonk().with(["armorClass"], 16).with(["armourClass"], 16).with(["ac"], 16);
    const [armour] = numbersOf(reply.reader());
    expect(armour?.value.isKnown).toBe(false);
  });

  it("takes hit points from the override", () => {
    const [, hitPoints] = numbersOf(MadeUpReply.levelOneMonk().with(["overrideHitPoints"], 14).reader());
    expect(hitPoints?.value.valueOr(0)).toBe(14);
  });

  it("marks hit points not known when there is no override", () => {
    const [, hitPoints] = numbersOf(MadeUpReply.levelOneMonk().reader());
    expect(hitPoints?.value.isKnown).toBe(false);
  });
});
