import type { ItemEvent, ItemRecord, Source } from "./campaign";
import { holderKeyOf } from "./holder-key";

export interface NewHolding {
  readonly holder: string;
  readonly holderLinked: boolean;
  readonly held: number;
  readonly source: Source;
}

export class ItemHoldings {
  readonly records: ItemRecord[] = [];
  readonly history: ItemEvent[] = [];

  constructor(
    private written: string,
    private readonly name: string,
  ) {}

  keepWritten(item: string): void {
    const written = item.trim();
    if (!written.includes("[[") && this.written.includes("[[")) return;
    this.written = written;
    for (const record of this.records) record.written = written;
  }

  holdingOf(holder: string): ItemRecord | null {
    const key = holderKeyOf(holder);
    for (const record of this.records) {
      if (holderKeyOf(record.holder) === key) return record;
    }
    return null;
  }

  heldBy(holders: readonly string[]): ItemRecord | null {
    for (const holder of holders) {
      const record = this.holdingOf(holder);
      if (record !== null && record.gone === null) return record;
    }
    return this.firstHeld();
  }

  firstHeld(): ItemRecord | null {
    for (const record of this.records) {
      if (record.gone === null) return record;
    }
    return null;
  }

  first(): ItemRecord | null {
    const [record] = this.records;
    if (record === undefined) return null;
    return record;
  }

  add({ holder, holderLinked, held, source }: NewHolding): ItemRecord {
    const record: ItemRecord = { name: this.name, written: this.written, holder, holderLinked, links: [], source, history: this.history, gone: null, held };
    this.records.push(record);
    return record;
  }

  remove(record: ItemRecord): void {
    const at = this.records.indexOf(record);
    if (at !== -1) this.records.splice(at, 1);
  }
}
