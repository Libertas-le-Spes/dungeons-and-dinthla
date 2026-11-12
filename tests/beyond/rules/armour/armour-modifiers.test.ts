import { describe, expect, it } from "vitest";
import { armourClassOf, modifierOf } from "../../builders/made-up-rule-character";

describe("armourModifiersOf", () => {
  it("adds a plain armour class modifier from a worn item and shows its source", () => {
    const ring = modifierOf("bonus", "armor-class", 1, "Ring of Protection");
    expect(armourClassOf({ modifiers: [ring] })).toEqual({ value: 11, working: "10 + DEX 0 + Ring of Protection 1 = 11, no armour" });
  });

  it("leaves out a plain modifier whose item is not worn", () => {
    const ring = { ...modifierOf("bonus", "armor-class", 1, "Ring of Protection"), appliesNow: false };
    expect(armourClassOf({ modifiers: [ring] }).value).toBe(10);
  });

  it("lists a bonus with a restriction and does not apply it", () => {
    const bracers = modifierOf("bonus", "armor-class", 2, "Bracers of Defense", "while wearing no armour and no shield");
    expect(armourClassOf({ modifiers: [bracers] })).toEqual({ value: 10, working: "10 + DEX 0 = 10, no armour. Plus conditional bonuses I don't apply: Bracers of Defense" });
  });

  it("lists the Dual Wielder feat and does not apply it", () => {
    expect(armourClassOf({ features: ["Dual Wielder"] }).working).toBe("10 + DEX 0 = 10, no armour. Plus conditional bonuses I don't apply: Dual Wielder");
  });

  it("lists the dual wield modifier once, with the feat that holds it", () => {
    const wielder = modifierOf("bonus", "dual-wield-armor-class", 1, "Dual Wielder");
    expect(armourClassOf({ features: ["Dual Wielder"], modifiers: [wielder] }).working).toBe("10 + DEX 0 = 10, no armour. Plus conditional bonuses I don't apply: Dual Wielder");
  });

  it("lists Bladesong and does not apply it", () => {
    expect(armourClassOf({ features: ["Bladesong"] }).working).toContain("Bladesong");
  });
});
