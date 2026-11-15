import { describe, expect, it } from "vitest";
import { ruleClassesOf } from "../../../../src/beyond/reply/rule-input/body/read-rule-classes";
import { MadeUpReply } from "../../builders/made-up-reply";

function classesOf(reply: MadeUpReply): string[] {
  return ruleClassesOf(reply.reader()).map((ruleClass) => `${ruleClass.name.text}|${ruleClass.subclass}|${ruleClass.level}|${ruleClass.hitDie}`);
}

describe("ruleClassesOf", () => {
  it("takes the name, the level and the hit die, with no subclass", () => {
    expect(classesOf(MadeUpReply.levelOneMonk())).toEqual(["Monk||1|8"]);
  });

  it("takes the subclass name", () => {
    const reply = MadeUpReply.levelOneMonk().with(["classes", 0, "subclassDefinition"], { name: "Way of the Open Hand" });
    expect(classesOf(reply)).toEqual(["Monk|Way of the Open Hand|1|8"]);
  });

  it("takes every class in order", () => {
    const second = { level: 2, subclassDefinition: null, definition: { name: "Rogue", hitDice: 8 }, classFeatures: [] };
    const reply = MadeUpReply.levelOneMonk().with(["classes"], [{ level: 3, definition: { name: "Fighter", hitDice: 10 } }, second]);
    expect(classesOf(reply)).toEqual(["Fighter||3|10", "Rogue||2|8"]);
  });

  it("makes a level that is not a number not a number, so the engine refuses it", () => {
    expect(ruleClassesOf(MadeUpReply.levelOneMonk().with(["classes", 0, "level"], "1").reader())[0]?.level).toBeNaN();
  });

  it("makes a hit die that is not a number not a number, so the engine refuses it", () => {
    expect(ruleClassesOf(MadeUpReply.levelOneMonk().with(["classes", 0, "definition", "hitDice"], null).reader())[0]?.hitDie).toBeNaN();
  });

  it("refuses a subclass that has no name", () => {
    expect(() => ruleClassesOf(MadeUpReply.levelOneMonk().with(["classes", 0, "subclassDefinition"], {}).reader())).toThrow('"name" is missing or is not text');
  });

  it("refuses more classes than the limit", () => {
    const many = Array.from({ length: 21 }, () => ({ level: 1, definition: { name: "Monk", hitDice: 8 } }));
    expect(() => ruleClassesOf(MadeUpReply.levelOneMonk().with(["classes"], many).reader())).toThrow("The list of classes is over the limit");
  });
});
