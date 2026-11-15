import { CleanLine } from "../../../src/beyond/text/clean-line";
import type { ImportedCharacter } from "../../../src/beyond/shape/imported-character";
import { NotKnownValue } from "../../../src/beyond/shape/not-known-value";
import { Pdf } from "../../../src/beyond/shape/route";
import type { WorkedValue } from "../../../src/beyond/shape/worked-value";

const ROUTE = new Pdf();

function missing(): WorkedValue<number> {
  return new NotKnownValue("Left blank on the sheet.", ROUTE);
}

export function notKnownCharacter(): ImportedCharacter {
  return {
    route: ROUTE,
    name: CleanLine.of("Primary Monk"),
    species: CleanLine.of("Human"),
    size: null,
    creatureType: null,
    alignment: null,
    classes: [{ name: CleanLine.of("Monk"), level: missing() }],
    scores: {
      strength: missing(),
      dexterity: missing(),
      constitution: missing(),
      intelligence: missing(),
      wisdom: missing(),
      charisma: missing(),
    },
    numbers: [{ name: "AC", value: missing() }],
    inventory: [{ name: CleanLine.of("Rope"), count: missing() }],
    purse: { platinum: missing(), gold: missing(), electrum: missing(), silver: missing(), copper: missing() },
    spells: [],
    features: [],
  };
}
