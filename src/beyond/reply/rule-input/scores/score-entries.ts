import type { Cap } from "../../../shape/cap";
import { AbilityTable } from "../../../rules/input/by-ability";
import type { ByAbility } from "../../../rules/input/by-ability";
import { abilityListedTwice } from "../../common/reply-refusals";
import type { JsonReader } from "../../json/json-reader";
import { ABILITY_IDS } from "./ability-ids";

export interface ScoreList {
  readonly data: JsonReader;
  readonly key: string;
  readonly cap: Cap;
}

export class ScoreEntries {
  private readonly numbers = new Map<number, number>();
  private readonly emptied = new Set<number>();
  private unexpectedForm = false;

  static of(read: ScoreList): ScoreEntries {
    const entries = new ScoreEntries();
    for (const entry of read.data.listAt(read.key, read.cap)) entries.add(entry);
    return entries;
  }

  get isUnexpected(): boolean {
    return this.unexpectedForm;
  }

  valued(): ByAbility<number> {
    const table = new AbilityTable<number>();
    for (const { id, ability } of ABILITY_IDS) {
      const found = this.numbers.get(id);
      if (found !== undefined) table.with(ability, found);
    }
    return table;
  }

  valuedWithEmptyAsZero(): ByAbility<number> {
    const table = new AbilityTable<number>();
    for (const { id, ability } of ABILITY_IDS) {
      const found = this.numbers.get(id);
      if (found !== undefined) table.with(ability, found);
      else if (this.emptied.has(id)) table.with(ability, 0);
    }
    return table;
  }

  private add(entry: JsonReader): void {
    const id = entry.numberAt("id");
    if (id === null || !Number.isInteger(id)) {
      this.unexpectedForm = true;
      return;
    }
    if (entry.isNullAt("value")) {
      this.emptied.add(id);
      return;
    }
    if (entry.holdsNothingAt("value")) return;
    this.addValue(id, entry.numberAt("value"));
  }

  private addValue(id: number, value: number | null): void {
    if (value === null) {
      this.unexpectedForm = true;
      return;
    }
    if (this.numbers.has(id)) throw abilityListedTwice();
    this.numbers.set(id, value);
  }
}
