import { formatMoney } from "../../notes/parts/money";
import type { CoinCount, FundsSummary } from "./funds-summary";

export interface PurseBoxParts {
  panel: HTMLElement;
  title: string;
}

export interface PurseShown {
  summary: FundsSummary;
  empty: string;
}

function coinText({ kind, count }: CoinCount): string {
  const written = Math.abs(count).toLocaleString("en");
  if (count < 0) return `−${written} ${kind}`;
  return `${written} ${kind}`;
}

export class PurseBox {
  constructor(private readonly parts: PurseBoxParts) {}

  render({ summary, empty }: PurseShown): void {
    const { panel, title } = this.parts;
    panel.empty();
    panel.createEl("h2", { cls: "dd-title", text: title });
    panel.createDiv({ cls: "dd-purse", text: formatMoney(summary.purse) });
    const coins = panel.createDiv({ cls: "dd-coins" });
    const chips = summary.coinCounts.map(coinText);
    if (summary.ledger.length === 0 && chips.length === 0) {
      coins.createSpan({ cls: "dd-empty", text: empty });
    } else if (chips.join(" ") !== formatMoney(summary.purse)) {
      coins.createSpan({ cls: "dd-coins-label", text: "In coins:" });
      for (const chip of chips) coins.createSpan({ cls: "dd-coin", text: chip });
    }
    const inOut = panel.createDiv({ cls: "dd-in-out" });
    inOut.createSpan({ text: "In " }).createEl("b", { text: formatMoney(summary.totalIn) });
    inOut.createSpan({ text: "Out " }).createEl("b", { text: formatMoney(summary.totalOut) });
  }
}
