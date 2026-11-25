import { Div, Span } from "../../../views/elements/kinds/containers";
import type { ViewElement } from "../../../views/elements/view-element";
import type { PurseCoin } from "../lists/purse-coin";

export const NO_COIN = "No coin.";
const NOT_KNOWN_COUNT = "?";

function chipText(coin: PurseCoin): string {
  if (coin.count === null) return `${NOT_KNOWN_COUNT} ${coin.coin}`;
  return `${coin.count.toLocaleString("en")} ${coin.coin}`;
}

function isShown(coin: PurseCoin): boolean {
  return coin.count !== 0;
}

export function coinChips(coins: readonly PurseCoin[]): ViewElement {
  const shown = coins.filter(isShown);
  const chips: ViewElement[] = [];
  if (shown.length === 0) chips.push(new Span({ cls: ["dd-empty"], text: NO_COIN }));
  for (const coin of shown) chips.push(new Span({ cls: ["dd-coin"], text: chipText(coin) }));
  return new Div({ cls: ["dd-coins"] }, chips);
}
