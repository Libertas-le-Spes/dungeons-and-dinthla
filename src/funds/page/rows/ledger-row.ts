import { formatMoney } from "../../../notes/parts/money";
import type { LinkOpener } from "../../../views/components/rows/link-name";
import { LinkedText } from "../../../views/components/rows/linked-text";
import { SourceRow } from "../../../views/components/rows/source-row";
import type { PageAction } from "../../../views/elements/bindings/page-action";
import type { ElementBinding } from "../../../views/elements/bindings/element-binding";
import { ListItem, Span } from "../../../views/elements/kinds/containers";
import type { LedgerLine } from "../funds-summary";

function signedMoney(copper: number): string {
  if (copper <= 0) return formatMoney(copper);
  return `+${formatMoney(copper)}`;
}

function directionOf(moneyOut: boolean): string {
  if (moneyOut) return "Out";
  return "In";
}

export class LedgerRow {
  constructor(private readonly opener: LinkOpener) {}

  build({ record, balance }: LedgerLine, open: PageAction, bindings: readonly ElementBinding[] = []): ListItem {
    const linked = new LinkedText([], record.source.path, this.opener);
    const row = new SourceRow(record.source, open).build([
      new Span({ cls: ["dd-direction"], text: directionOf(record.entry.moneyOut) }),
      new Span({ cls: ["dd-what"] }, linked.build(record.text)),
      new Span({ cls: ["dd-amount"], text: signedMoney(record.entry.copper) }),
      new Span({ cls: ["dd-balance"], text: formatMoney(balance) }),
    ], { cls: ["dd-ledger-row"], bindings });
    return new ListItem({}, [row]);
  }
}
