import type { ItemRecord } from "../../campaign/campaign";
import { holderNameOf, THE_PARTY_LABEL } from "../items/item-groups";
import { holderTextOf } from "../items/item-plan";

export const HOLDER_PROPERTY = "holder";

export function holderPropertyOf(item: ItemRecord): string {
  if (holderNameOf(item.holder) === "") return THE_PARTY_LABEL;
  return holderTextOf(item);
}
