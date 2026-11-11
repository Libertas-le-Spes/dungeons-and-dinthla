import type { Source } from "../../campaign/campaign";

export class RowKeys {
  private readonly keys = new WeakMap<Element, string>();

  mark(row: Element, key: string): void {
    this.keys.set(row, key);
  }

  keyOf(row: Element): string | undefined {
    return this.keys.get(row);
  }
}

export const SOURCE_ROWS = new RowKeys();

export const ITEM_ROWS = new RowKeys();

export const VALUE_BUTTONS = new RowKeys();

export function sourceKeyOf(source: Source): string {
  return `${source.path}\n${source.line}`;
}
