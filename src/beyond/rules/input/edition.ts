export type Edition = "2014" | "2024" | "not stated";

export function isTwentyFourteen(edition: Edition): boolean {
  return edition === "2014";
}
