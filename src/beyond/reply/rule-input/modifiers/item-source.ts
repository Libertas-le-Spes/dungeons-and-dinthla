import { INVENTORY_COUNT } from "../../../shape/import-limits";
import type { RuleModifier } from "../../../rules/input/rule-modifier";
import { CleanLine } from "../../../text/clean-line";
import type { JsonReader } from "../../json/json-reader";
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

function isInForce(carried: Carried): boolean {
  if (!carried.equipped) return false;
  if (!carried.needsAttunement) return true;
  return carried.attuned;
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

  modifierOf(entry: JsonReader): RuleModifier {
    const id = entry.numberAt("componentId");
    const subType = CleanLine.of(entry.textAt("subType"));
    if (id === null) return unreadableModifierOf(subType, CleanLine.of(this.key));
    const found = this.groups.get(id);
    if (found === undefined) return unreadableModifierOf(subType, CleanLine.of(this.key));
    return modifierEntryOf(entry, found.name, found.copies.some(isInForce));
  }
}
