import { ledgerMarker } from "./ledger-marker";
import type { SourceKind } from "./source-kind";

export const coinSourceKind: SourceKind = {
  name: "coin",
  marker: ledgerMarker,
  followUps: [],
  folder: "Funds",
  page: "funds",
};
