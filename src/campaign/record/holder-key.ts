import { unlink } from "../../notes/parts/link";

const THE_PARTY = "the party";

export function holderKeyOf(holder: string): string {
  const name = unlink(holder).trim().toLowerCase();
  if (name === THE_PARTY) return "";
  return name.slice(name.lastIndexOf("/") + 1).replace(/\.md$/, "");
}
