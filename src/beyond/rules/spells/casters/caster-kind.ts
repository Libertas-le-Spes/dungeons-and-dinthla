import type { Edition } from "../../input/edition";
import type { SlotTable } from "../slots/tables/slot-table";

export interface CasterKind {
  readonly label: string;
  readonly table: SlotTable;
  readonly contributes: boolean;
  readonly firstCastingLevel: number;
  editionKnows(edition: Edition): boolean;
  casterLevelOf(classLevel: number): number;
}
