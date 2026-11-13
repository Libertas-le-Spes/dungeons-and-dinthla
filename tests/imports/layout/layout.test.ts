import { describe, expect, it } from "vitest";
import {
  IMPORT_PROPERTIES,
  IMPORTED_FROM_PROPERTY,
  IMPORTED_ON_PROPERTY,
  SHEET_VALUE_PROPERTIES,
} from "../../../src/imports/layout/import-properties";
import { PLUGIN_SECTIONS } from "../../../src/imports/layout/plugin-sections";
import { IMPORTED_PROPERTIES } from "../../../src/imports/note/properties/imported-properties";
import { importMarkLinesOf } from "../../../src/imports/note/properties/import-mark-lines";
import { monkSheet, TODAY } from "../builders/made-up-import";

function nameOf(entry: { name: string }): string {
  return entry.name;
}

describe("the layout the sheet and the note writer share", () => {
  it("heads the five sections as the owner's design words them", () => {
    expect(PLUGIN_SECTIONS.map((section) => section.heading)).toEqual([
      "## Numbers (from D&D Beyond)",
      "## Inventory (from D&D Beyond)",
      "## Purse (from D&D Beyond)",
      "## Spells (from D&D Beyond)",
      "## Features (from D&D Beyond)",
    ]);
  });

  it("names the import's two marks plain, as the plan has them", () => {
    expect([IMPORTED_ON_PROPERTY, IMPORTED_FROM_PROPERTY]).toEqual(["imported", "imported-from"]);
  });

  it("names the sheet's own values, so the sheet reads them as it reads any other", () => {
    expect(SHEET_VALUE_PROPERTIES).toEqual(["class", "species", "AC", "HP", "speed", "STR", "DEX", "CON", "INT", "WIS", "CHA"]);
  });

  it("lists every property the writer can write, and no other, as an import property", () => {
    const written = [...importMarkLinesOf(monkSheet().character.route, TODAY).map(keyOf), ...IMPORTED_PROPERTIES.map(nameOf)];
    expect(written).toEqual(IMPORT_PROPERTIES);
  });
});

function keyOf(line: string): string {
  return line.slice(0, line.indexOf(":"));
}
