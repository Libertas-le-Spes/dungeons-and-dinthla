export type Edition = "2014" | "2024" | "not stated";

export const EDITION_NOT_2014 = "Edition is not 2014.";

export function isTwentyFourteen(edition: Edition): boolean {
  return edition === "2014";
}
