import type { RuleModifier } from "../../../rules/input/rule-modifier";
import { CleanLine } from "../../../text/clean-line";
import type { JsonReader } from "../../json/json-reader";
import { numericOf } from "../body/numeric-of";
import type { ClassOwners } from "./class-owners";
import { ListedSource } from "./listed-source";
import type { ModifierNames } from "./modifier-names";
import type { ModifierSource } from "./modifier-source";
import { unreadableModifierOf } from "./unreadable-modifier";

export class ClassSource implements ModifierSource {
  readonly key = "class";
  private readonly listed: ListedSource;

  constructor(
    names: ModifierNames,
    private readonly owners: ClassOwners,
  ) {
    this.listed = new ListedSource(this.key, names);
  }

  keeps(entry: JsonReader): boolean {
    return !this.isOfAnotherClass(entry);
  }

  modifierOf(entry: JsonReader): RuleModifier {
    if (this.isOfUnplacedClass(entry)) return unreadableModifierOf(CleanLine.of(entry.textAt("subType")), CleanLine.of(this.key));
    return this.listed.modifierOf(entry);
  }

  private startedBy(entry: JsonReader): boolean | undefined {
    return this.owners.startedBy.get(numericOf(entry.numberAt("componentId")));
  }

  private isSharedWithMulticlass(entry: JsonReader): boolean {
    if (!this.owners.isMulticlass) return true;
    return entry.booleanAt("availableToMulticlass");
  }

  private isOfAnotherClass(entry: JsonReader): boolean {
    if (this.isSharedWithMulticlass(entry)) return false;
    return this.startedBy(entry) === false;
  }

  private isOfUnplacedClass(entry: JsonReader): boolean {
    if (this.isSharedWithMulticlass(entry)) return false;
    return this.startedBy(entry) === undefined;
  }
}
