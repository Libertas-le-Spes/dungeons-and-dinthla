import { describe, expect, it } from "vitest";
import { workedNumbersOf } from "../../../../src/beyond/reply/worked/worked-numbers";
import { MadeUpReply } from "../../builders/made-up-reply";

function numbersOf(reply: MadeUpReply): Map<string, string> {
  const found = new Map<string, string>();
  for (const number of workedNumbersOf(reply.reader())) {
    if (number.value.isKnown) found.set(number.name, `${number.value.valueOr(0)}`);
    else found.set(number.name, "not known");
  }
  return found;
}

function explanationOf(reply: MadeUpReply, name: string): string {
  for (const number of workedNumbersOf(reply.reader())) {
    if (number.name === name) return number.value.explanation;
  }
  throw new Error(`No number named ${name}.`);
}

function valuesOf(reply: MadeUpReply, names: string[]): string[] {
  const found = numbersOf(reply);
  return names.map((name) => `${name} ${found.get(name)}`);
}

const MONK_WITHOUT_ALERT = (): MadeUpReply => MadeUpReply.levelOneMonk().with(["feats"], []).with(["modifiers", "feat"], []);

describe("workedNumbersOf, for the made-up monk", () => {
  it("works out the scores, the modifiers, the proficiency bonus and the vitals", () => {
    expect(valuesOf(MadeUpReply.levelOneMonk(), ["STR", "DEX", "CON", "INT", "WIS", "CHA", "DEX modifier", "INT modifier", "WIS modifier", "Proficiency bonus", "Total level", "Hit dice", "HP", "Current HP", "Temporary HP", "AC", "Speed", "Carrying capacity"])).toEqual([
      "STR 10",
      "DEX 16",
      "CON 12",
      "INT 9",
      "WIS 14",
      "CHA 10",
      "DEX modifier 3",
      "INT modifier -1",
      "WIS modifier 2",
      "Proficiency bonus 2",
      "Total level 1",
      "Hit dice 1",
      "HP 13",
      "Current HP 13",
      "Temporary HP 0",
      "AC 15",
      "Speed 30",
      "Carrying capacity 150",
    ]);
  });

  it("adds the bonus of a modifier to the score, and names where it comes from", () => {
    expect(explanationOf(MadeUpReply.levelOneMonk(), "INT")).toBe("base 8 + bonus 0 + Alert 1 = 9");
  });

  it("works out saves, skills and passives from the proficiencies the modifiers grant", () => {
    expect(valuesOf(MadeUpReply.levelOneMonk(), ["DEX save", "STR save", "Acrobatics", "Insight", "Athletics", "Passive Perception", "Passive Insight"])).toEqual([
      "DEX save 5",
      "STR save 0",
      "Acrobatics 5",
      "Insight 4",
      "Athletics 0",
      "Passive Perception 12",
      "Passive Insight 14",
    ]);
  });

  it("works out the armor class with the monk's unarmoured defence, and says so", () => {
    expect(explanationOf(MadeUpReply.levelOneMonk(), "AC")).toBe("10 + DEX 3 + WIS 2 = 15, monk's unarmoured defence");
  });

  it("does not know initiative with the Alert feat, and names the feat", () => {
    expect(numbersOf(MadeUpReply.levelOneMonk()).get("Initiative")).toBe("not known");
    expect(explanationOf(MadeUpReply.levelOneMonk(), "Initiative")).toContain("Alert");
  });

  it("works out initiative without it", () => {
    expect(numbersOf(MONK_WITHOUT_ALERT()).get("Initiative")).toBe("3");
  });

  it("marks every number as worked out on the online route", () => {
    expect(workedNumbersOf(MadeUpReply.levelOneMonk().reader()).every((number) => number.value.route.name === "online")).toBe(true);
  });

  it("does not know the speed of a monk who has reached unarmored movement, and names it", () => {
    const reply = MadeUpReply.levelOneMonk().with(["classes", 0, "level"], 2);
    expect(numbersOf(reply).get("Speed")).toBe("not known");
    expect(explanationOf(reply, "Speed")).toContain("Unarmored Movement");
  });

  it("counts a character with a Powerful Build as one size larger for the carrying capacity", () => {
    const reply = MadeUpReply.levelOneMonk().with(["race", "racialTraits"], [{ definition: { id: 1, name: "Powerful Build" } }]);
    expect(numbersOf(reply).get("Carrying capacity")).toBe("300");
  });

  it("does not know the hit points when the dice total is missing, and says so", () => {
    const reply = MadeUpReply.levelOneMonk().without(["baseHitPoints"]);
    expect(numbersOf(reply).get("HP")).toBe("not known");
    expect(explanationOf(reply, "HP")).toBe("The dice total or the bonus hit points are missing.");
  });

  it("subtracts the hit points lost from the current hit points", () => {
    expect(valuesOf(MadeUpReply.levelOneMonk().with(["removedHitPoints"], 4), ["Current HP"])).toEqual(["Current HP 9"]);
  });
});

describe("workedNumbersOf, with values set by hand on D&D Beyond", () => {
  it("takes a score set by hand over the one worked out, and works the rest from it", () => {
    const reply = MadeUpReply.levelOneMonk().with(["overrideStats", 0, "value"], 18);
    expect(valuesOf(reply, ["STR", "STR modifier", "Carrying capacity", "DEX"])).toEqual(["STR 18", "STR modifier 4", "Carrying capacity 270", "DEX 16"]);
    expect(explanationOf(reply, "STR")).toBe("Set by hand");
  });

  it("takes hit points set by hand over the dice, and says so", () => {
    const reply = MadeUpReply.levelOneMonk().with(["overrideHitPoints"], 30);
    expect(valuesOf(reply, ["HP", "Current HP"])).toEqual(["HP 30", "Current HP 30"]);
    expect(explanationOf(reply, "HP")).toBe("Set by hand");
  });

  it("does not know any score, nor what follows from it, when the scores come in an unexpected form", () => {
    const reply = MadeUpReply.levelOneMonk().with(["overrideStats"], [{ id: "1", value: 12 }]);
    const found = numbersOf(reply);
    expect(["STR", "CHA", "STR modifier", "DEX save", "AC", "Carrying capacity"].map((name) => found.get(name))).toEqual(Array(6).fill("not known"));
    expect(explanationOf(reply, "STR")).toBe("Scores unreadable.");
  });

  it("does not know the hit points, nor the current hit points, when they are set in an unexpected form", () => {
    const reply = MadeUpReply.levelOneMonk().with(["overrideHitPoints"], "30");
    expect(valuesOf(reply, ["HP", "Current HP"])).toEqual(["HP not known", "Current HP not known"]);
    expect(explanationOf(reply, "HP")).toBe("Hit points unreadable.");
  });

  it("does not know the speed when one is set by hand, and says so", () => {
    const reply = MadeUpReply.levelOneMonk().with(["customSpeeds"], [{ distance: 40 }]);
    expect(numbersOf(reply).get("Speed")).toBe("not known");
    expect(explanationOf(reply, "Speed")).toContain("set by hand");
  });
});

describe("workedNumbersOf, for the made-up fighter", () => {
  const fighter = (): MadeUpReply => MadeUpReply.levelThreeFighter();

  it("works out the vitals from the dice, the constitution and the armour worn", () => {
    expect(valuesOf(fighter(), ["Total level", "Proficiency bonus", "Hit dice", "HP", "Current HP", "AC", "Speed", "Initiative", "Carrying capacity"])).toEqual([
      "Total level 3",
      "Proficiency bonus 2",
      "Hit dice 3",
      "HP 34",
      "Current HP 29",
      "AC 19",
      "Speed 30",
      "Initiative 1",
      "Carrying capacity 225",
    ]);
  });

  it("says how the armor class is made up, with the shield and the Defense feat", () => {
    expect(explanationOf(fighter(), "AC")).toBe("Chain Mail 16 + DEX 0 + Shield 2 + Defense 1 = 19, heavy armour");
  });

  it("works out saves and skills from the proficiencies", () => {
    expect(valuesOf(fighter(), ["STR save", "CON save", "DEX save", "Athletics", "Perception", "Passive Perception"])).toEqual([
      "STR save 4",
      "CON save 4",
      "DEX save 1",
      "Athletics 4",
      "Perception 2",
      "Passive Perception 12",
    ]);
  });

  it("leaves armour that is not equipped out of the armor class", () => {
    const reply = fighter().with(["inventory", 0, "equipped"], false).with(["inventory", 1, "equipped"], false);
    expect(explanationOf(reply, "AC")).toBe("10 + DEX 1 = 11, no armour");
  });

  it("does not know the armor class when a worn item's armor type is not one it knows, and names armor class", () => {
    const reply = fighter().with(["inventory", 0, "definition", "armorTypeId"], 9);
    expect(numbersOf(reply).get("AC")).toBe("not known");
    expect(explanationOf(reply, "AC")).toContain('"armor-class"');
  });

  it("does not know the armor class when an item modifier matches no item in the inventory", () => {
    const reply = fighter().with(["modifiers", "item"], [{ type: "bonus", subType: "armor-class", value: 1, restriction: "", requiresAttunement: false, componentId: 999 }]);
    expect(numbersOf(reply).get("AC")).toBe("not known");
  });

  it("adds the bonus of a worn item's modifier to the armor class", () => {
    const reply = fighter().with(["modifiers", "item"], [{ type: "bonus", subType: "armor-class", value: 1, restriction: "", requiresAttunement: false, componentId: 20 }]);
    expect(explanationOf(reply, "AC")).toBe("Chain Mail 16 + DEX 0 + Shield 2 + Defense 1 + Chain Mail 1 = 20, heavy armour");
  });

  it("does not add the bonus of a worn item that needs attunement and is not attuned", () => {
    const charm = { quantity: 1, equipped: true, isAttuned: false, definition: { id: 30, name: "Pale Charm", canAttune: true, armorTypeId: null, armorClass: null, strengthRequirement: null } };
    const modifier = { type: "bonus", subType: "armor-class", value: 1, restriction: "", requiresAttunement: false, componentId: 30 };
    const withCharm = fighter().with(["inventory", 2], charm).with(["modifiers", "item"], [modifier]);
    expect(explanationOf(withCharm, "AC")).toBe("Chain Mail 16 + DEX 0 + Shield 2 + Defense 1 = 19, heavy armour");
    const attuned = fighter().with(["inventory", 2], { ...charm, isAttuned: true }).with(["modifiers", "item"], [modifier]);
    expect(explanationOf(attuned, "AC")).toBe("Chain Mail 16 + DEX 0 + Shield 2 + Defense 1 + Pale Charm 1 = 20, heavy armour");
  });

  it("does not know the speed when the armour needs more strength than the character has", () => {
    const reply = fighter().with(["inventory", 0, "definition", "strengthRequirement"], 17);
    expect(numbersOf(reply).get("Speed")).toBe("not known");
  });

  it("does not know the armor class when a different class holds a set unarmored-armor-class modifier by the same name", () => {
    const reply = fighter().with(["modifiers", "class"], [{ type: "set", subType: "unarmored-armor-class", value: null, restriction: "", requiresAttunement: false, componentId: 910 }]);
    expect(numbersOf(reply).get("AC")).toBe("not known");
  });
});
