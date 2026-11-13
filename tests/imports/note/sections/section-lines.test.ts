import { describe, expect, it } from "vitest";
import { KnownValue } from "../../../../src/beyond/shape/known-value";
import { NotKnownValue } from "../../../../src/beyond/shape/not-known-value";
import { Online, type Route } from "../../../../src/beyond/shape/route";
import { CleanLine } from "../../../../src/beyond/text/clean-line";
import { FeaturesContent } from "../../../../src/imports/note/sections/features-content";
import { InventoryContent } from "../../../../src/imports/note/sections/inventory-content";
import { leftOutLinesOf } from "../../../../src/imports/note/sections/left-out-line";
import { NumbersContent } from "../../../../src/imports/note/sections/numbers-content";
import { numberLineOf } from "../../../../src/imports/note/sections/number-line";
import { PurseContent } from "../../../../src/imports/note/sections/purse-content";
import { SPELLS_SECTION } from "../../../../src/imports/layout/plugin-sections";
import { SpellsContent } from "../../../../src/imports/note/sections/spells-content";
import { SECTION_CONTENTS } from "../../../../src/imports/note/sections/section-contents";
import { MadeUpSheet } from "../../../beyond/builders/made-up-sheet";
import { monkSheet, noLoss, notKnownNumber, sheetOf, sheetWithCharacter } from "../../builders/made-up-import";
import { PRINTED } from "../../../../src/beyond/sheet/printed-route";

const ONLINE = new Online();

function known(value: number, working: string, route: Route = ONLINE): KnownValue {
  return KnownValue.wholeNumber(value, working, route);
}

describe("numberLineOf", () => {
  it("writes the name, the value and the route, for a printed number with no working", () => {
    expect(numberLineOf("AC", known(18, "", PRINTED))).toBe("- AC · 18 · Printed on D&D Beyond's PDF");
  });

  it("writes the working between the value and the route when there is one", () => {
    expect(numberLineOf("AC", known(16, "10 + DEX 4 + WIS 2 = 16", ONLINE))).toBe("- AC · 16 · 10 + DEX 4 + WIS 2 = 16 · Worked out here, from D&D Beyond (online)");
  });

  it("writes not known and the reason for a number that is not known", () => {
    expect(numberLineOf("AC", new NotKnownValue("The sheet's field is blank.", PRINTED))).toBe("- AC · not known · The sheet's field is blank. · Printed on D&D Beyond's PDF");
  });

  it("makes a link in the name or the working inert", () => {
    expect(numberLineOf("[[A]]", known(1, "[[B]] and a: b", PRINTED))).toBe("- \\[\\[A\\]\\] · 1 · \\[\\[B\\]\\] and a: b · Printed on D&D Beyond's PDF");
  });
});

describe("NumbersContent", () => {
  const lines = new NumbersContent().linesOf(monkSheet());

  it("writes the six scores first, in the order of the sheet", () => {
    expect(lines.slice(0, 6)).toEqual([
      "- STR · 11 · Printed on D&D Beyond's PDF",
      "- DEX · 12 · Printed on D&D Beyond's PDF",
      "- CON · 13 · Printed on D&D Beyond's PDF",
      "- INT · 14 · Printed on D&D Beyond's PDF",
      "- WIS · 15 · Printed on D&D Beyond's PDF",
      "- CHA · 16 · Printed on D&D Beyond's PDF",
    ]);
  });

  it("then writes every number of the import, one line each", () => {
    expect(lines.length).toBe(6 + monkSheet().character.numbers.length);
    expect(lines).toContain("- AC · 18 · Printed on D&D Beyond's PDF");
  });

  it("writes not known for a score that is blank", () => {
    const blank = new NumbersContent().linesOf(sheetOf(MadeUpSheet.monk().with("DEX", "")));
    expect(blank[1]).toMatch(/^- DEX · not known · /);
  });
});

describe("InventoryContent", () => {
  it("writes each item with its count after a times sign", () => {
    expect(new InventoryContent().linesOf(monkSheet()).slice(0, 3)).toEqual(["- Item 0 × 1", "- Item 1 × 2", "- Item 2 × 3"]);
  });

  it("writes a question mark for a count that is not known", () => {
    const sheet = sheetWithCharacter(monkSheet(), { inventory: [{ name: CleanLine.of("Rope"), count: notKnownNumber() }] });
    expect(new InventoryContent().linesOf(sheet)).toEqual(["- Rope × ?"]);
  });

  it("makes markup in an item's name inert", () => {
    const sheet = sheetWithCharacter(monkSheet(), { inventory: [{ name: CleanLine.of("Rope: [[Secret]]"), count: known(1, "") }] });
    expect(new InventoryContent().linesOf(sheet)).toEqual(["- Rope\\: \\[\\[Secret\\]\\] × 1"]);
  });

  it("keeps an item named like the left-out line from passing for it", () => {
    const sheet = sheetWithCharacter(monkSheet(), { inventory: [{ name: CleanLine.of("Left out: 1 too long, 1 not clean"), count: known(1, "") }] });
    expect(new InventoryContent().linesOf(sheet)).toEqual(["- Left out\\: 1 too long, 1 not clean × 1"]);
  });

  it("ends with the left-out line when the sheet left items out", () => {
    const sheet = { ...monkSheet(), leftOut: { ...monkSheet().leftOut, items: { tooLong: 2, notClean: 1 } } };
    const lines = new InventoryContent().linesOf(sheet);
    expect(lines[lines.length - 1]).toBe("- Left out: 2 too long, 1 not clean");
  });
});

describe("leftOutLinesOf", () => {
  it("writes nothing when nothing was left out", () => {
    expect(leftOutLinesOf(noLoss())).toEqual([]);
  });

  it("writes a line when only lines that were too long were left out", () => {
    expect(leftOutLinesOf({ tooLong: 3, notClean: 0 })).toEqual(["- Left out: 3 too long, 0 not clean"]);
  });

  it("writes a line when only lines that were not clean were left out", () => {
    expect(leftOutLinesOf({ tooLong: 0, notClean: 4 })).toEqual(["- Left out: 0 too long, 4 not clean"]);
  });
});

describe("PurseContent", () => {
  it("writes the five coins from platinum down to copper", () => {
    expect(new PurseContent().linesOf(monkSheet())).toEqual(["- pp · 61", "- gp · 62", "- ep · 63", "- sp · 64", "- cp · 65"]);
  });

  it("writes not known for a coin that is blank", () => {
    expect(new PurseContent().linesOf(sheetOf(MadeUpSheet.monk().with("GP", ""))).slice(1, 2)).toEqual(["- gp · not known"]);
  });
});

describe("SpellsContent and FeaturesContent", () => {
  it("write each spell as a line, and each feature line as a line", () => {
    expect(new SpellsContent().linesOf(monkSheet()).slice(0, 2)).toEqual(["- Spell of spellName0", "- Spell of spellName1"]);
    expect(new FeaturesContent().linesOf(monkSheet()).slice(0, 2)).toEqual(["- Feature 0a", "- Feature 0b"]);
  });

  it("make a spell's markup inert", () => {
    const sheet = sheetWithCharacter(monkSheet(), { spells: [CleanLine.of("Range: 60 feet [[x]]")] });
    expect(new SpellsContent().linesOf(sheet)).toEqual(["- Range\\: 60 feet \\[\\[x\\]\\]"]);
  });

  it("make a feature line that looks like a marker inert", () => {
    const sheet = sheetWithCharacter(monkSheet(), { features: [CleanLine.of("$ 5 gp")] });
    expect(new FeaturesContent().linesOf(sheet)).toEqual(["- \\$ 5 gp"]);
  });

  it("end with the sheet's own left-out count for their list", () => {
    const sheet = { ...monkSheet(), leftOut: { items: noLoss(), spells: { tooLong: 1, notClean: 0 }, features: { tooLong: 0, notClean: 2 } } };
    expect(new SpellsContent().linesOf(sheet).pop()).toBe("- Left out: 1 too long, 0 not clean");
    expect(new FeaturesContent().linesOf(sheet).pop()).toBe("- Left out: 0 too long, 2 not clean");
  });
});

describe("SECTION_CONTENTS", () => {
  it("writes the sections in the order the layout lists them", () => {
    expect(SECTION_CONTENTS.map((content) => content.section.title)).toEqual(["Numbers", "Inventory", "Purse", "Spells", "Features"]);
    expect(SECTION_CONTENTS[3]!.section).toBe(SPELLS_SECTION);
  });
});
