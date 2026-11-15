import { describe, expect, it } from "vitest";
import type { FieldValue } from "../../../../src/pdf/fields/field-value";
import { readPrintedSheet } from "../../../../src/beyond/sheet/read-printed-sheet";
import { MadeUpSheet } from "../../builders/made-up-sheet";

class RecordingFields extends Map<string, FieldValue> {
  readonly asked: string[] = [];

  override get(name: string): FieldValue | undefined {
    this.asked.push(name);
    return super.get(name);
  }
}

function namesAskedFor(): string[] {
  const fields = new RecordingFields(MadeUpSheet.monk().fields());
  readPrintedSheet(fields);
  return fields.asked;
}

const AWKWARD_NAMES = ["CLASS  LEVEL", "DEXmod ", "Stealth ", "CHamod", "SleightofHand", "Animal", "ST Strength", "Eq Name25", "SpellName49", "spellName4", "spellCastingClass0"];

describe("the field names the reader asks the sheet for", () => {
  it("are exactly the names the made-up sheet fills, no more and no fewer", () => {
    expect([...namesAskedFor()].sort()).toEqual(MadeUpSheet.monk().names().sort());
  });

  it("are each asked for once", () => {
    const names = namesAskedFor();
    expect(new Set(names).size).toBe(names.length);
  });

  it("are a hundred and sixty-one", () => {
    expect(namesAskedFor()).toHaveLength(161);
  });

  it.each(AWKWARD_NAMES)("include %j exactly as the form writes it, with its stray spaces", (name) => {
    expect(namesAskedFor()).toContain(name);
  });

  it.each(["DEXmod", "Stealth", "CLASS LEVEL", "CHAmod", "Sleight of Hand", "SpellName0", "spellName5"])("do not include the near miss %j", (name) => {
    expect(namesAskedFor()).not.toContain(name);
  });
});
