import { describe, expect, it } from "vitest";
import type { CharacterCard } from "../../../src/characters/cards/character-card";
import { ownCharacterFirst } from "../../../src/characters/cards/own-character-first";

function cardOf(name: string, isOwn = false): CharacterCard {
  return { path: `Pale Moon/Characters/${name}.md`, name, values: new Map(), isOwn };
}

function namesOf(cards: CharacterCard[]): string[] {
  return cards.map((card) => card.name);
}

describe("ownCharacterFirst", () => {
  it("puts the player's own character first and keeps everyone else in the order given", () => {
    const cards = [cardOf("Brother Aldric"), cardOf("Lady Vess"), cardOf("Thessaly", true), cardOf("Mira")];
    expect(namesOf(ownCharacterFirst(cards))).toEqual(["Thessaly", "Brother Aldric", "Lady Vess", "Mira"]);
  });

  it("puts every card linked as the player's own first, each once, in the order given", () => {
    const cards = [cardOf("Mira"), cardOf("Thessaly", true), cardOf("Brother Aldric"), cardOf("Lady Vess", true)];
    expect(namesOf(ownCharacterFirst(cards))).toEqual(["Thessaly", "Lady Vess", "Mira", "Brother Aldric"]);
  });

  it("keeps the order given when no card is the player's own", () => {
    const cards = [cardOf("Mira"), cardOf("Brother Aldric"), cardOf("Lady Vess")];
    expect(namesOf(ownCharacterFirst(cards))).toEqual(["Mira", "Brother Aldric", "Lady Vess"]);
  });
});
