export interface SetFloor {
  readonly value: number;
  readonly source: string;
}

export class ModifierTally {
  added = 0;
  readonly applied: string[] = [];
  readonly conditional: string[] = [];
  readonly unknown: string[] = [];
  readonly floors: SetFloor[] = [];
  private readonly conditionalSources = new Set<string>();

  add(amount: number, source: string): void {
    this.added += amount;
    this.applied.push(`${source} ${amount}`);
  }

  noteFloor(value: number, source: string): void {
    this.floors.push({ value, source });
  }

  noteConditional(source: string): void {
    if (this.conditionalSources.has(source)) return;
    this.conditionalSources.add(source);
    this.conditional.push(source);
  }

  noteUnknown(name: string): void {
    this.unknown.push(name);
  }
}
