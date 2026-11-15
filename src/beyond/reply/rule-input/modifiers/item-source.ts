import { INVENTORY_COUNT } from "../../../shape/import-limits";
import type { RuleModifier } from "../../../rules/input/rule-modifier";
import { CleanLine } from "../../../text/clean-line";
import type { JsonReader } from "../../json/json-reader";
import { numericOf } from "../body/numeric-of";
import { definitionNameOf } from "../../parts/definition-name";
import { modifierEntryOf } from "./modifier-entry";
import type { ModifierSource } from "./modifier-source";
import { unreadableModifierOf } from "./unreadable-modifier";

interface Carried {
  readonly name: CleanLine;
  readonly equipped: boolean;
  readonly attuned: boolean;
  readonly needsAttunement: boolean;
}

function carriedOf(entry: JsonReader): Carried {
  return {
    name: definitionNameOf(entry),
    equipped: entry.booleanAt("equipped"),
    attuned: entry.booleanAt("isAttuned"),
    needsAttunement: entry.readerAt("definition").booleanAt("canAttune"),
  };
}

interface CarriedGroup {
  readonly name: CleanLine;
  readonly copies: readonly Carried[];
}

function groupWith(group: CarriedGroup | undefined, carried: Carried): CarriedGroup {
  if (group === undefined) return { name: carried.name, copies: [carried] };
  return { name: group.name, copies: [...group.copies, carried] };
}

function isWorn(carried: Carried): boolean {
  return carried.equipped;
}

function isAttunedIfNeeded(carried: Carried): boolean {
  if (!carried.needsAttunement) return true;
  return carried.attuned;
}

function repeatKeyOf(entry: JsonReader): string {
  return JSON.stringify([entry.numberAt("componentId"), entry.textAt("type"), entry.textAt("subType"), entry.numberAt("value")]);
}

export class ItemSource implements ModifierSource {
  readonly key = "item";

  private constructor(private readonly groups: ReadonlyMap<number, CarriedGroup>) {}

  static of(data: JsonReader): ItemSource {
    const groups = new Map<number, CarriedGroup>();
    for (const entry of data.listAt("inventory", INVENTORY_COUNT)) {
      const id = entry.readerAt("definition").numberAt("id");
      if (id === null) continue;
      groups.set(id, groupWith(groups.get(id), carriedOf(entry)));
    }
    return new ItemSource(groups);
  }

  modifiersOf(entries: readonly JsonReader[]): readonly RuleModifier[] {
    const seen = new Set<string>();
    return entries.map((entry) => this.modifierSeen(entry, seen));
  }

  private modifierSeen(entry: JsonReader, seen: Set<string>): RuleModifier {
    const key = repeatKeyOf(entry);
    if (seen.has(key)) return this.unreadable(entry);
    seen.add(key);
    return this.modifierOf(entry);
  }

  private unreadable(entry: JsonReader): RuleModifier {
    return unreadableModifierOf(CleanLine.of(entry.textAt("subType")), CleanLine.of(this.key));
  }

  private modifierOf(entry: JsonReader): RuleModifier {
    const found = this.groups.get(numericOf(entry.numberAt("componentId")));
    if (found === undefined) return this.unreadable(entry);
    const worn = found.copies.filter(isWorn);
    if (worn.length > 1) return this.unreadable(entry);
    return modifierEntryOf({ entry, sourceName: found.name, inForce: worn.some(isAttunedIfNeeded) });
  }
}
