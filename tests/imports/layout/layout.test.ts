import { describe, expect, it } from "vitest";
import {
  IMPORT_PROPERTIES,
  IMPORTED_FROM_PROPERTY,
  IMPORTED_ON_PROPERTY,
  SHEET_VALUE_PROPERTIES,
} from "../../../src/imports/layout/import-properties";
import type { PluginSection } from "../../../src/imports/layout/plugin-section";
import { PLUGIN_SECTIONS } from "../../../src/imports/layout/plugin-sections";
import { importMarkLinesOf } from "../../../src/imports/note/properties/helpers/import-mark-lines";
import { IMPORTED_PROPERTIES } from "../../../src/imports/note/properties/imported-properties";
import { monkSheet, TODAY } from "../builders/made-up-import";

function nameOf(entry: { name: string }): string {
  return entry.name;
}

function headingOf(section: PluginSection): string {
  return section.heading;
}

function keyOf(line: string): string {
  return line.replace(/:.*$/, "");
}

describe("the layout the sheet and the note writer share", () => {
  it("heads the five sections as the owner's design words them", () => {
    expect(PLUGIN_SECTIONS.map(headingOf)).toEqual([
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
    const marks = importMarkLinesOf(monkSheet().character.route, TODAY).map(keyOf);
    expect([...marks, ...IMPORTED_PROPERTIES.map(nameOf)]).toEqual(IMPORT_PROPERTIES);
  });
});
