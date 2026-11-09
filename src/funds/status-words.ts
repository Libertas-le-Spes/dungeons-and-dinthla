import type { ItemStatus } from "./item-plan";

export const STATUS_WORDS: Record<ItemStatus, string> = { held: "Held", sold: "Sold", used: "Used up", lost: "Lost" };
