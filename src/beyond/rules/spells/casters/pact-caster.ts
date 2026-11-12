import type { CasterKind } from "./caster-kind";
import { SlotTable } from "../slots/tables/slot-table";

export class PactCaster implements CasterKind {
  readonly label = "pact caster";
  readonly table = new SlotTable([]);
  readonly contributes = false;
  readonly differsByEdition = false;

  casterLevelOf(): number {
    return 0;
  }
}
