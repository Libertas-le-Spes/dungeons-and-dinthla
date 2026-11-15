import type { Edition } from "../../../rules/input/edition";

export function agreedEdition(editions: readonly Edition[]): Edition {
  const first = editions.find(isStated);
  if (first === undefined) return "not stated";
  if (editions.every((edition) => edition === first)) return first;
  return "not stated";
}

function isStated(edition: Edition): boolean {
  return edition !== "not stated";
}
