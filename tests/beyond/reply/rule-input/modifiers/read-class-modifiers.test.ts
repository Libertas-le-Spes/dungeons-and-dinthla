import { describe, expect, it } from "vitest";
import { ruleModifiersOf } from "../../../../../src/beyond/reply/rule-input/modifiers/read-rule-modifiers";
import { MadeUpReply } from "../../../builders/made-up-reply";

function feature(id: number, name: string): object {
  return { definition: { id, name, requiredLevel: 1 } };
}

interface ClassFields {
  readonly name: string;
  readonly starting: unknown;
  readonly features: object[];
}

function classOf(fields: ClassFields): object {
  return { level: 1, isStartingClass: fields.starting, definition: { name: fields.name, hitDice: 8 }, classFeatures: fields.features };
}

interface ModifierFields {
  readonly subType: string;
  readonly componentId: number | null;
  readonly available: unknown;
}

function modifier(fields: ModifierFields): Record<string, unknown> {
  return { type: "proficiency", subType: fields.subType, value: null, restriction: "", availableToMulticlass: fields.available, componentId: fields.componentId };
}

function only(modifiers: object[]): object {
  return { race: [], class: modifiers, background: [], item: [], feat: [], condition: [] };
}

function multiclass(modifiers: object[]): MadeUpReply {
  const classes = [classOf({ name: "Warlock", starting: true, features: [feature(1, "Warlock Proficiencies")] }), classOf({ name: "Ranger", starting: false, features: [feature(2, "Ranger Proficiencies")] })];
  return MadeUpReply.levelOneMonk().with(["classes"], classes).with(["modifiers"], only(modifiers));
}

function readOf(reply: MadeUpReply): string[] {
  return ruleModifiersOf(reply.reader()).map((found) => `${found.type}|${found.subType.text}|${found.sourceName.text}`);
}

describe("class modifiers of a character with more than one class", () => {
  it("keeps the starting class's modifiers, whether or not they are open to multiclassing", () => {
    expect(readOf(multiclass([modifier({ subType: "wisdom-saving-throws", componentId: 1, available: false }), modifier({ subType: "light-armor", componentId: 1, available: true })]))).toEqual([
      "proficiency|wisdom-saving-throws|Warlock Proficiencies",
      "proficiency|light-armor|Warlock Proficiencies",
    ]);
  });

  it("drops a modifier of a later class that is not open to multiclassing, such as its saving throws", () => {
    expect(readOf(multiclass([modifier({ subType: "strength-saving-throws", componentId: 2, available: false })]))).toEqual([]);
  });

  it("keeps a modifier of a later class that is open to multiclassing", () => {
    expect(readOf(multiclass([modifier({ subType: "light-armor", componentId: 2, available: true })]))).toEqual(["proficiency|light-armor|Ranger Proficiencies"]);
  });

  it("marks a modifier not open to multiclassing, whose class cannot be found, unreadable", () => {
    expect(readOf(multiclass([modifier({ subType: "strength-saving-throws", componentId: 99, available: false })]))).toEqual(["unreadable|strength-saving-throws|class"]);
    expect(readOf(multiclass([modifier({ subType: "strength-saving-throws", componentId: null, available: false })]))).toEqual(["unreadable|strength-saving-throws|class"]);
  });

  it("keeps a modifier open to multiclassing whose class cannot be found", () => {
    expect(readOf(multiclass([modifier({ subType: "light-armor", componentId: 99, available: true })]))).toEqual(["proficiency|light-armor|class"]);
  });

  it("refuses a modifier that does not say whether it is open to multiclassing", () => {
    expect(() => readOf(multiclass([modifier({ subType: "light-armor", componentId: 1, available: "yes" })]))).toThrow('"availableToMulticlass" is missing or is not true or false');
  });

  it("refuses a class that does not say whether it is the starting class", () => {
    const reply = MadeUpReply.levelOneMonk().with(["classes", 0, "isStartingClass"], null);
    expect(() => readOf(reply)).toThrow('"isStartingClass" is missing or is not true or false');
  });

  it("does not ask a character with one class whether a modifier is open to multiclassing", () => {
    const reply = MadeUpReply.levelOneMonk().with(["modifiers"], only([{ type: "proficiency", subType: "acrobatics", value: null, componentId: 900 }]));
    expect(readOf(reply)).toEqual(["proficiency|acrobatics|Unarmored Defense"]);
  });
});
