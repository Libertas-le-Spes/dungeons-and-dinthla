import type { Source } from "../../campaign/record/campaign";
import { ABILITIES, sameName, sheetNameOf, type SheetValues, type SourcedFact } from "./sheet-values";
import { firstRanked, type Rank } from "./value-ranks";

export const NOT_KNOWN = "?";

export type ValueState = "learned" | "unknown" | "override" | "imported" | "carried";

export type CarriedGroup = "abilities" | "values";

export interface StatedValue {
  value: string;
  source: Source;
}

export interface CarriedValues {
  campaign: string;
  values: Map<string, StatedValue>;
}

export interface SheetValue {
  name: string;
  label: string;
  state: ValueState;
  shown: StatedValue | null;
  override: StatedValue | null;
  imported: StatedValue | null;
  learned: StatedValue | null;
  carried: StatedValue | null;
  carriedCampaign: string | null;
  earlier: StatedValue[];
}

export interface CharacterSheet {
  abilities: SheetValue[];
  values: SheetValue[];
}

const ROW_NAMES = ["type", "subtitle", "class", "AC", "HP", "speed", "alignment"];

const LABELS = new Map<string, string>([
  ["type", "Type line"],
  ["subtitle", "Subtitle"],
  ["class", "Class"],
  ["AC", "Armor Class"],
  ["HP", "Hit Points"],
  ["speed", "Speed"],
  ["alignment", "Alignment"],
  ["species", "Species"],
]);

export function labelOf(name: string): string {
  const label = LABELS.get(name);
  if (label === undefined) return name;
  return label;
}

export function groupOf(name: string): CarriedGroup {
  if (ABILITIES.includes(name)) return "abilities";
  return "values";
}

function stated(fact: SourcedFact): StatedValue {
  return { value: fact.value, source: fact.source };
}

export function lastStated(facts: SourcedFact[], name: string): StatedValue | null {
  const stating = facts.filter((fact) => sameName(fact.name, name));
  const last = stating[stating.length - 1];
  if (last === undefined) return null;
  return stated(last);
}

function sameSource(first: Source, second: Source): boolean {
  return first.path === second.path && first.line === second.line;
}

function carriedFor(carried: CarriedValues, name: string): StatedValue | null {
  for (const [carriedName, value] of carried.values) {
    if (sameName(carriedName, name)) return value;
  }
  return null;
}

function importedFor(imported: readonly SourcedFact[], name: string): StatedValue | null {
  let found: StatedValue | null = null;
  for (const fact of imported) {
    if (sameName(fact.name, name)) found = stated(fact);
  }
  return found;
}

function ranksOf(value: SheetValue): Rank[] {
  return [
    { state: "override", stated: value.override, questionMarkMeansUnknown: false },
    { state: "imported", stated: value.imported, questionMarkMeansUnknown: true },
    { state: "learned", stated: value.learned, questionMarkMeansUnknown: true },
    { state: "carried", stated: value.carried, questionMarkMeansUnknown: true },
  ];
}

function showRanked(value: SheetValue): void {
  const ranked = firstRanked(ranksOf(value), NOT_KNOWN);
  if (ranked === null) return;
  value.shown = ranked.shown;
  value.state = ranked.state;
}

export interface SheetFacts {
  readonly learned: SourcedFact[];
  readonly imported: readonly SourcedFact[];
  readonly overrides: SourcedFact[];
  readonly carried: CarriedValues | null;
}

export interface CarriedFacts {
  readonly campaign: string;
  readonly learned: SourcedFact[];
  readonly imported: readonly SourcedFact[];
  readonly overrides: SourcedFact[];
  readonly groups: CarriedGroup[];
}

function sheetValueOf(name: string, { learned, imported, overrides, carried }: SheetFacts): SheetValue {
  const value: SheetValue = {
    name,
    label: labelOf(name),
    state: "unknown",
    shown: null,
    override: lastStated(overrides, name),
    imported: importedFor(imported, name),
    learned: lastStated(learned, name),
    carried: null,
    carriedCampaign: null,
    earlier: [],
  };
  if (carried !== null) {
    const carriedValue = carriedFor(carried, name);
    if (carriedValue !== null) {
      value.carried = carriedValue;
      value.carriedCampaign = carried.campaign;
    }
  }
  showRanked(value);
  const lines = [...learned, ...overrides].filter((fact) => sameName(fact.name, name)).map(stated);
  const shown = value.shown;
  if (shown === null) value.earlier = lines;
  else value.earlier = lines.filter((line) => !sameSource(line.source, shown.source));
  return value;
}

function otherNamesOf(facts: SourcedFact[], carried: CarriedValues | null): string[] {
  const names: string[] = [];
  const known = [...ABILITIES, ...ROW_NAMES];
  let carriedNames: string[] = [];
  if (carried !== null) carriedNames = [...carried.values.keys()];
  for (const name of [...facts.map((fact) => sheetNameOf(fact.name)), ...carriedNames]) {
    if (known.includes(name) || names.some((seen) => sameName(seen, name))) continue;
    names.push(name);
  }
  return names;
}

export function characterSheetOf(facts: SheetFacts): CharacterSheet {
  const { learned, imported, overrides, carried } = facts;
  const valueOf = (name: string) => sheetValueOf(name, facts);
  return {
    abilities: ABILITIES.map(valueOf),
    values: [...ROW_NAMES, ...otherNamesOf([...learned, ...imported, ...overrides], carried)].map(valueOf),
  };
}

export function carriedValuesOf({ campaign, learned, imported, overrides, groups }: CarriedFacts): CarriedValues {
  const values = new Map<string, StatedValue>();
  for (const fact of [...learned, ...imported, ...overrides]) {
    const name = sheetNameOf(fact.name);
    if (!groups.includes(groupOf(name))) continue;
    const already = [...values.keys()].find((seen) => sameName(seen, name));
    if (already !== undefined) values.delete(already);
    values.set(name, stated(fact));
  }
  return { campaign, values };
}

export function shownValuesOf(sheet: CharacterSheet): SheetValues {
  const values: SheetValues = new Map();
  for (const value of [...sheet.abilities, ...sheet.values]) {
    if (value.shown !== null) values.set(value.name, value.shown.value);
  }
  return values;
}
