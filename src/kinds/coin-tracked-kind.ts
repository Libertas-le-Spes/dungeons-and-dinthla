import { ledgerMarker } from "./ledger-marker";
import type { TrackedKind } from "./tracked-kind";

export const coinTrackedKind = {
  name: "coin",
  marker: ledgerMarker,
  followUps: {},
  folder: "Funds",
  page: "funds",
} satisfies TrackedKind;
