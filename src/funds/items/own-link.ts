import { holderNameOf } from "./item-groups";

export interface LinksOfOwn {
  links: readonly string[];
  ownNames: readonly string[];
}

export function ownLinkOf({ links, ownNames }: LinksOfOwn): string | undefined {
  const own = new Set(ownNames.map((name) => name.toLowerCase()));
  return links.find((link) => own.has(holderNameOf(link).toLowerCase()));
}
