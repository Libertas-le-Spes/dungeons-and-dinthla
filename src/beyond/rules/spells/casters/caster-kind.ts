import type { SlotTable } from "../slots/tables/slot-table";

export interface CasterKind {
  readonly label: string;
  readonly table: SlotTable;
  readonly contributes: boolean;
  readonly differsByEdition: boolean;
  casterLevelOf(classLevel: number): number;
}
