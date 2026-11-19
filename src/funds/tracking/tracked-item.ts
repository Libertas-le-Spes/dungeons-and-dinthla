import { storedItemKeyOf } from "../../characters/imported/lists/item-key";
import { countTextOf } from "../../notes/parts/item-count";

const MOST_COUNT = 9_999;
const COUNT = /^[1-9]\d*$/;

export function trackedCountOf(count: string | null): number | null {
  if (count === null || !COUNT.test(count)) return null;
  const number = Number(count);
  if (number < 2 || number > MOST_COUNT) return null;
  return number;
}

export interface TrackedItem {
  readonly line: string;
  readonly written: string;
  readonly key: string;
  readonly holderName: string;
}

export function trackedLineOf(holderText: string, written: string, count: number | null): string {
  return `$ ${holderText} ${written}${countTextOf(count)}`;
}

export interface TrackedParts {
  readonly holderText: string;
  readonly written: string;
  readonly holderName: string;
  readonly count: number | null;
}

export function trackedItemOf({ holderText, written, holderName, count }: TrackedParts): TrackedItem {
  return { line: trackedLineOf(holderText, written, count), written, key: storedItemKeyOf(written), holderName };
}
