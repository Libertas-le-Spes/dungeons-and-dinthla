import type { FieldValue } from "../../pdf/fields/field-value";
import { classesOf } from "./classes/read-classes";
import { featuresOf } from "./parts/read-features";
import { inventoryOf } from "./parts/read-inventory";
import { oneRowEach } from "../shape/one-row-each";
import { numbersOf } from "./parts/read-numbers";
import { purseOf } from "./parts/read-purse";
import { scoresOf } from "./parts/read-scores";
import { spellsOf } from "./parts/read-spells";
import type { PrintedSheet } from "./printed-sheet";
import { PRINTED } from "./printed-route";
import { SheetFields } from "./sheet-fields";
import { printedLineOf } from "./parts/read-printed-line";
import { ALIGNMENT, NAME_LINE, SIZE, SPECIES_LINE } from "./table/identity-fields";

export function readPrintedSheet(values: ReadonlyMap<string, FieldValue>): PrintedSheet {
  const fields = new SheetFields(values);
  const inventory = inventoryOf(fields);
  const spells = spellsOf(fields);
  const features = featuresOf(fields);
  return {
    character: {
      route: PRINTED,
      name: NAME_LINE.read(fields),
      species: SPECIES_LINE.read(fields),
      size: printedLineOf(fields, SIZE),
      creatureType: null,
      alignment: printedLineOf(fields, ALIGNMENT),
      classes: classesOf(fields),
      scores: scoresOf(fields),
      numbers: numbersOf(fields),
      inventory: oneRowEach(inventory.items),
      purse: purseOf(fields),
      spells: spells.lines,
      features: features.lines,
    },
    leftOut: { items: inventory.loss, spells: spells.loss, features: features.loss },
    beyondNumber: null,
  };
}
