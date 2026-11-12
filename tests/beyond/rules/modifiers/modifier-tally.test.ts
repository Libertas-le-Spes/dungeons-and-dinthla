import { describe, expect, it } from "vitest";
import type { ModifierHandler } from "../../../../src/beyond/rules/modifiers/modifier-handler";
import { ModifierTally } from "../../../../src/beyond/rules/modifiers/modifier-tally";
import { SubTypeFamily } from "../../../../src/beyond/rules/modifiers/sub-type-family";
import { tallyModifiers } from "../../../../src/beyond/rules/modifiers/tally-modifiers";
import { unknownModifiers } from "../../../../src/beyond/rules/modifiers/unknown-modifiers";
import { ROUTE, modifierOf } from "../../builders/made-up-rule-character";

describe("ModifierTally", () => {
  it("keeps each conditional source once, in the order it first came", () => {
    const tally = new ModifierTally();
    for (const source of ["B", "A", "B", "C", "A"]) tally.noteConditional(source);
    expect(tally.conditional).toEqual(["B", "A", "C"]);
  });

  it("notes ten thousand conditional sources, each once, with one pass over them", () => {
    const tally = new ModifierTally();
    for (let place = 0; place < 10_000; place += 1) tally.noteConditional(`Source ${place % 5_000}`);
    expect(tally.conditional).toHaveLength(5_000);
  });
});

describe("tallyModifiers counted steps", () => {
  it("asks a handler once for each modifier it touches, and no more, over 2000 modifiers", () => {
    let asked = 0;
    const counting: ModifierHandler = {
      handles() {
        asked += 1;
        return true;
      },
      applyTo(tally, modifier) {
        tally.noteConditional(modifier.sourceName.text);
      },
    };
    const modifiers = [];
    for (let place = 0; place < 2_000; place += 1) modifiers.push(modifierOf("bonus", "stealth", 1, `Source ${place}`));
    const tally = tallyModifiers(modifiers, new SubTypeFamily(["stealth"], []), [counting]);
    expect([asked, tally.conditional.length]).toEqual([2_000, 2_000]);
  });
});

describe("unknownModifiers", () => {
  it("names up to five unknown sub-types and counts the rest", () => {
    const tally = new ModifierTally();
    for (let place = 0; place < 8; place += 1) tally.noteUnknown(`kind-${place}`);
    expect(unknownModifiers(tally, ROUTE)?.explanation).toBe('D&D Beyond names a rule I can\'t work out here: "kind-0", "kind-1", "kind-2", "kind-3", "kind-4" and 3 more. Type it on your note to set it.');
  });

  it("is nothing when nothing is unknown", () => {
    expect(unknownModifiers(new ModifierTally(), ROUTE)).toBeNull();
  });
});
