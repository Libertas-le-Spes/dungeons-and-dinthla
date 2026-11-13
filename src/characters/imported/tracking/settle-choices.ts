import type { SettledStatus } from "./item-tracking";

export interface SettleChoice {
  readonly label: string;
  readonly status: SettledStatus;
}

export const SETTLE_CHOICES: readonly SettleChoice[] = [
  { label: "Used up", status: "used" },
  { label: "Sold", status: "sold" },
  { label: "Lost", status: "lost" },
  { label: "Changed", status: "held" },
];
