import { describe, expect, it } from "vitest";
import { alignmentOf } from "../../../../src/beyond/reply/details/read-alignment";
import { creatureTypeOf } from "../../../../src/beyond/reply/details/read-creature-type";
import { sizeOf } from "../../../../src/beyond/reply/details/read-size";
import { MadeUpReply } from "../../builders/made-up-reply";

const MONK = () => MadeUpReply.levelOneMonk();

function sizeModifier(subType: string | null) {
  return { type: "size", subType, value: null, componentId: 1, componentTypeId: 1 };
}

function traitOf(name: string, description: string) {
  return { definition: { id: 1, name, description } };
}

describe("alignmentOf", () => {
  it.each([
    [1, "Lawful good"],
    [2, "Neutral good"],
    [3, "Chaotic good"],
    [4, "Lawful neutral"],
    [5, "Neutral"],
    [6, "Chaotic neutral"],
    [7, "Lawful evil"],
    [8, "Neutral evil"],
    [9, "Chaotic evil"],
  ])("reads %i as %s", (id, name) => {
    expect(alignmentOf(MONK().with(["alignmentId"], id).reader())?.text).toBe(name);
  });

  it.each([undefined, null, 0, 10, "5", 2.5])("reads nothing from %j", (id) => {
    expect(alignmentOf(MONK().with(["alignmentId"], id).reader())).toBeNull();
  });
});

describe("sizeOf", () => {
  it.each([
    [2, "Tiny"],
    [3, "Small"],
    [4, "Medium"],
    [5, "Large"],
    [6, "Huge"],
    [7, "Gargantuan"],
  ])("reads the size id %i as %s", (id, name) => {
    expect(sizeOf(MONK().with(["race", "sizeId"], id).reader())?.text).toBe(name);
  });

  it.each([1, 10, 99, null, "4"])("reads nothing from the size id %j when no modifier chose a size", (id) => {
    expect(sizeOf(MONK().with(["race", "sizeId"], id).reader())).toBeNull();
  });

  it("reads the size the player chose, from the species' size modifier, when the species lets them choose", () => {
    const chosen = MONK().with(["race", "sizeId"], 10).with(["modifiers", "race"], [sizeModifier("small")]);
    expect(sizeOf(chosen.reader())?.text).toBe("Small");
    const other = MONK().with(["race", "sizeId"], 10).with(["modifiers", "race"], [sizeModifier("medium")]);
    expect(sizeOf(other.reader())?.text).toBe("Medium");
  });

  it("lets a chosen size win over the size id", () => {
    expect(sizeOf(MONK().with(["modifiers", "race"], [sizeModifier("small")]).reader())?.text).toBe("Small");
  });

  it("reads a size written with spaces around it", () => {
    expect(sizeOf(MONK().with(["race", "sizeId"], 10).with(["modifiers", "race"], [sizeModifier(" Small ")]).reader())?.text).toBe("Small");
  });

  it("takes the same size named twice", () => {
    expect(sizeOf(MONK().with(["modifiers", "race"], [sizeModifier("small"), sizeModifier("Small")]).reader())?.text).toBe("Small");
  });

  it("reads nothing when the modifiers name two sizes, rather than guess", () => {
    expect(sizeOf(MONK().with(["modifiers", "race"], [sizeModifier("small"), sizeModifier("large")]).reader())).toBeNull();
  });

  it("ignores a modifier that is not about size, has no type or sub type, or names no size", () => {
    const others = [{ type: "bonus", subType: "small" }, sizeModifier(null), { type: null, subType: "small" }, sizeModifier("enormous")];
    expect(sizeOf(MONK().with(["modifiers", "race"], others).reader())?.text).toBe("Medium");
  });
});

describe("creatureTypeOf", () => {
  it("reads the creature type id 11 as Humanoid", () => {
    expect(creatureTypeOf(MONK().with(["race", "creatureTypeId"], 11).reader())?.text).toBe("Humanoid");
  });

  it("reads nothing from an id it has no name for, and no trait", () => {
    expect(creatureTypeOf(MONK().with(["race", "creatureTypeId"], 3).reader())).toBeNull();
    expect(creatureTypeOf(MONK().reader())).toBeNull();
  });

  it("reads the type a species states in its Creature Type trait when the id is not one it knows", () => {
    const traits = [traitOf("Speed", "<p>Your Speed is 30 feet.</p>"), traitOf("Creature Type", "<p>You are a Construct.</p>")];
    expect(creatureTypeOf(MONK().with(["race", "creatureTypeId"], 3).with(["race", "racialTraits"], traits).reader())?.text).toBe("Construct");
  });

  it("reads nothing from a trait of another name that happens to say You are a type", () => {
    const traits = [traitOf("Fey Ancestry", "<p>You are a Fey.</p>")];
    expect(creatureTypeOf(MONK().with(["race", "racialTraits"], traits).reader())).toBeNull();
  });

  it("reads the same trait written with You're and an", () => {
    const traits = [traitOf("Creature Type", "You're an Aberration.")];
    expect(creatureTypeOf(MONK().with(["race", "racialTraits"], traits).reader())?.text).toBe("Aberration");
  });

  it("lets the id win over the trait", () => {
    const traits = [traitOf("Creature Type", "<p>You are a Construct.</p>")];
    expect(creatureTypeOf(MONK().with(["race", "creatureTypeId"], 11).with(["race", "racialTraits"], traits).reader())?.text).toBe("Humanoid");
  });

  it("reads nothing from a trait that is not worded as a type, or has no name or text", () => {
    const traits = [traitOf("Creature Type", "<p>Something else.</p>"), { definition: { id: 2 } }, { definition: { id: 3, name: "Creature Type" } }, { definition: { id: 4, description: "You are a Construct." } }];
    expect(creatureTypeOf(MONK().with(["race", "racialTraits"], traits).reader())).toBeNull();
  });

  it("reads nothing when the species lists no traits", () => {
    expect(creatureTypeOf(MONK().without(["race", "racialTraits"]).reader())).toBeNull();
  });
});
