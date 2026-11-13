import { PART_SEPARATOR } from "../../../imports/layout/section-line-format";

const WHOLE_NUMBER = /^\d+$/;

export interface PurseCoin {
  readonly coin: string;
  readonly count: number | null;
}

function countOf(text: string): number | null {
  if (WHOLE_NUMBER.test(text)) return Number(text);
  return null;
}

export function purseCoinOf(text: string): PurseCoin | null {
  const separator = text.indexOf(PART_SEPARATOR);
  if (separator === -1) return null;
  return { coin: text.substring(0, separator).trim(), count: countOf(text.substring(separator + PART_SEPARATOR.length).trim()) };
}

export function purseCoinsOf(entries: readonly string[]): PurseCoin[] {
  const coins: PurseCoin[] = [];
  for (const entry of entries) {
    const coin = purseCoinOf(entry);
    if (coin !== null) coins.push(coin);
  }
  return coins;
}
