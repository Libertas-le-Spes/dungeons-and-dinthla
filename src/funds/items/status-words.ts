import type { ItemStatus } from "./item-plan";

export const STATUS_WORDS: Record<ItemStatus, string> = { held: "Held", sold: "Sold", used: "Used up", lost: "Lost" };

export const ITEM_STATUSES: ItemStatus[] = ["held", "sold", "used", "lost"];

export const STATUS_CHOICES = [
  { value: "held", text: STATUS_WORDS.held },
  { value: "sold", text: STATUS_WORDS.sold },
  { value: "used", text: STATUS_WORDS.used },
  { value: "lost", text: STATUS_WORDS.lost },
];
