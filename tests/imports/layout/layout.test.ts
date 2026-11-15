import { describe, expect, it } from "vitest";
import { ROUTE_WORDS, UNNAMED_ROUTE_WORDS } from "../../../src/imports/layout/import-routes";
import { Online, Pdf } from "../../../src/beyond/shape/route";
import {
  IMPORT_PROPERTIES,
  IMPORTED_FROM_PROPERTY,
  IMPORTED_ON_PROPERTY,
  IMPORTED_SESSION_PROPERTY,
  SHEET_VALUE_PROPERTIES,
} from "../../../src/imports/layout/import-properties";
import type { PluginSection } from "../../../src/imports/layout/plugin-section";
import { PLUGIN_SECTIONS } from "../../../src/imports/layout/plugin-sections";
import { importMarkLinesOf } from "../../../src/imports/note/properties/helpers/import-mark-lines";
import { IMPORTED_PROPERTIES } from "../../../src/imports/note/properties/imported-properties";
import { monkSheet, stampedOn, TODAY } from "../builders/made-up-import";

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

  it("names the import's three marks plain, as the plan has them", () => {
    expect([IMPORTED_ON_PROPERTY, IMPORTED_FROM_PROPERTY, IMPORTED_SESSION_PROPERTY]).toEqual(["imported", "imported-from", "imported-session"]);
  });

  it("names the sheet's own values, so the sheet reads them as it reads any other", () => {
    expect(SHEET_VALUE_PROPERTIES).toEqual(["class", "species", "type", "subtitle", "AC", "HP", "speed", "STR", "DEX", "CON", "INT", "WIS", "CHA"]);
  });

  it("lists every property the writer can write, and no other, as an import property", () => {
    const marks = importMarkLinesOf({ route: monkSheet().character.route, stamp: stampedOn(TODAY) }).map(keyOf);
    expect([...marks, ...IMPORTED_PROPERTIES.map(nameOf)]).toEqual(IMPORT_PROPERTIES);
  });
});

describe("the words for each route", () => {
  it("are the routes' own words, by the name the import writes", () => {
    const online = new Online();
    const pdf = new Pdf();
    expect(ROUTE_WORDS.get(online.name)).toBe(online.source);
    expect(ROUTE_WORDS.get(pdf.name)).toBe(pdf.source);
    expect(ROUTE_WORDS.size).toBe(2);
    expect(UNNAMED_ROUTE_WORDS).toBe("From D&D Beyond");
  });
});
