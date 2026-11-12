import type { FieldValue } from "../../pdf/fields/field-value";
import type { ImportedCharacter } from "../shape/imported-character";
import { classesOf } from "./classes/read-classes";
import { featuresOf } from "./parts/read-features";
import { inventoryOf } from "./parts/read-inventory";
import { numbersOf } from "./parts/read-numbers";
import { purseOf } from "./parts/read-purse";
import { scoresOf } from "./parts/read-scores";
import { spellsOf } from "./parts/read-spells";
import { PRINTED } from "./printed-route";
import { SheetFields } from "./sheet-fields";
import { NAME_LINE, SPECIES_LINE } from "./table/identity-fields";

export function readPrintedSheet(values: ReadonlyMap<string, FieldValue>): ImportedCharacter {
  const fields = new SheetFields(values);
  return {
    route: PRINTED,
    name: NAME_LINE.read(fields),
    species: SPECIES_LINE.read(fields),
    classes: classesOf(fields),
    scores: scoresOf(fields),
    numbers: numbersOf(fields),
    inventory: inventoryOf(fields),
    purse: purseOf(fields),
    spells: spellsOf(fields),
    features: featuresOf(fields),
  };
}
