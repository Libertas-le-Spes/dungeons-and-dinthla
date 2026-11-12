export interface SlotRow {
  readonly level: number;
  readonly slots: readonly number[];
}

export class SlotTable {
  constructor(private readonly rows: readonly SlotRow[]) {}

  slotsAt(level: number): readonly number[] | undefined {
    if (level < 1) return [];
    const found = this.rows.find((row) => row.level === level);
    if (found === undefined) return undefined;
    return found.slots;
  }
}
