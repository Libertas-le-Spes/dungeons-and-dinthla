import type { Source } from "../campaign/campaign";
import { sameName } from "./character-entry";
import { ABILITIES, sheetNameOf, type SheetValues, type SourcedFact } from "./sheet-values";

export const NOT_KNOWN = "?";

export type ValueState = "learned" | "unknown" | "override" | "carried";

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

const LABELS: Record<string, string> = {
  type: "Type line",
  subtitle: "Subtitle",
  class: "Class",
  AC: "Armor Class",
  HP: "Hit Points",
  speed: "Speed",
  alignment: "Alignment",
};

export function labelOf(name: string): string {
  const label = LABELS[name];
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

function stateOf(shown: StatedValue, given: ValueState): ValueState {
  if (shown.value === NOT_KNOWN) return "unknown";
  return given;
}

function sheetValueOf(name: string, learned: SourcedFact[], overrides: SourcedFact[], carried: CarriedValues | null): SheetValue {
  const value: SheetValue = {
    name,
    label: labelOf(name),
    state: "unknown",
    shown: null,
    override: lastStated(overrides, name),
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
  if (value.override !== null) {
    value.shown = value.override;
    value.state = "override";
  } else if (value.learned !== null) {
    value.shown = value.learned;
    value.state = stateOf(value.learned, "learned");
  } else if (value.carried !== null) {
    value.shown = value.carried;
    value.state = stateOf(value.carried, "carried");
  }
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

export function characterSheetOf(learned: SourcedFact[], overrides: SourcedFact[], carried: CarriedValues | null): CharacterSheet {
  const valueOf = (name: string) => sheetValueOf(name, learned, overrides, carried);
  return {
    abilities: ABILITIES.map(valueOf),
    values: [...ROW_NAMES, ...otherNamesOf([...learned, ...overrides], carried)].map(valueOf),
  };
}

export function carriedValuesOf(campaign: string, learned: SourcedFact[], overrides: SourcedFact[], groups: CarriedGroup[]): CarriedValues {
  const values = new Map<string, StatedValue>();
  for (const fact of [...learned, ...overrides]) {
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
