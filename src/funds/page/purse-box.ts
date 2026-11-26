import { formatMoney } from "../../notes/parts/money";
import { HandleRequest } from "../../views/elements/bindings/bindings";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { Bold, Div, Heading2, Section, Span } from "../../views/elements/kinds/containers";
import type { ViewElement } from "../../views/elements/view-element";
import type { CoinCount, FundsSummary } from "./funds-summary";

export interface PurseShown {
  summary: FundsSummary;
  empty: string;
}

function coinText({ kind, count }: CoinCount): string {
  const written = Math.abs(count).toLocaleString("en");
  if (count < 0) return `−${written} ${kind}`;
  return `${written} ${kind}`;
}

function coinsOf({ summary, empty }: PurseShown): ViewElement[] {
  const chips = summary.coinCounts.map(coinText);
  if (summary.ledger.length === 0 && chips.length === 0) return [new Span({ cls: ["dd-empty"], text: empty })];
  if (chips.join(" ") === formatMoney(summary.purse)) return [];
  const coins: ViewElement[] = [new Span({ cls: ["dd-coins-label"], text: "In coins:" })];
  for (const chip of chips) coins.push(new Span({ cls: ["dd-coin"], text: chip }));
  return coins;
}

export class PurseBox {
  private readonly panel = new KeptHandle();

  constructor(private readonly title: string) {}

  tree(): ViewElement {
    return new Section({ cls: ["dd-panel", "dd-purse-panel"], bindings: [new HandleRequest(this.panel)] });
  }

  render(shown: PurseShown): void {
    const { summary } = shown;
    const inOut = new Div({ cls: ["dd-in-out"] }, [
      new Span({ text: "In " }, [new Bold({ text: formatMoney(summary.totalIn) })]),
      new Span({ text: "Out " }, [new Bold({ text: formatMoney(summary.totalOut) })]),
    ]);
    this.panel.showInside([
      new Heading2({ cls: ["dd-title"], text: this.title }),
      new Div({ cls: ["dd-purse"], text: formatMoney(summary.purse) }),
      new Div({ cls: ["dd-coins"] }, coinsOf(shown)),
      inOut,
    ]);
  }
}
