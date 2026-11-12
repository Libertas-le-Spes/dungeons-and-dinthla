export interface SlotRow {
  readonly level: number;
  readonly slots: readonly number[];
}

function isRowFor(level: number): (row: SlotRow) => boolean {
  return function isRow(row: SlotRow): boolean {
    return row.level === level;
  };
}

export class SlotTable {
  constructor(private readonly rows: readonly SlotRow[]) {}

  slotsAt(level: number): readonly number[] | undefined {
    if (level < 1) return [];
    const found = this.rows.find(isRowFor(level));
    if (found === undefined) return undefined;
    return found.slots;
  }
}
