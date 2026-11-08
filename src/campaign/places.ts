import type { Source } from "./campaign";

export function keepsEveryPlace(current: Source[], opened: Source[]): boolean {
  return opened.every((place) => current.some((source) => source.path === place.path && source.line === place.line));
}
