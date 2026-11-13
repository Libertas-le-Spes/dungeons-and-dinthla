import { itemKeyOf } from "../../characters/imported/lists/item-key";

export interface TrackedItem {
  readonly line: string;
  readonly written: string;
  readonly key: string;
  readonly holderName: string;
}

export function trackedLineOf(holderText: string, written: string): string {
  return `$ ${holderText} ${written}`;
}

export function trackedItemOf(holderText: string, written: string, holderName: string): TrackedItem {
  return { line: trackedLineOf(holderText, written), written, key: itemKeyOf(written), holderName };
}
