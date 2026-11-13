import type { PurseCoin } from "../lists/purse-coin";

export const NO_COIN = "No coin.";
export const NOT_IN_THE_PARTY_PURSE = "From D&D Beyond. It is not added to the party purse.";
const NOT_KNOWN_COUNT = "?";

function chipText(coin: PurseCoin): string {
  if (coin.count === null) return `${NOT_KNOWN_COUNT} ${coin.coin}`;
  return `${coin.count.toLocaleString("en")} ${coin.coin}`;
}

function isShown(coin: PurseCoin): boolean {
  return coin.count !== 0;
}

export function addCoinChips(parent: HTMLElement, coins: readonly PurseCoin[]): void {
  const shown = coins.filter(isShown);
  const chips = parent.createDiv({ cls: "dd-coins" });
  if (shown.length === 0) chips.createSpan({ cls: "dd-empty", text: NO_COIN });
  for (const coin of shown) chips.createSpan({ cls: "dd-coin", text: chipText(coin) });
}
