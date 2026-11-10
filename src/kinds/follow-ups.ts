import { FOLLOW_UP_NAMES, type FollowUpName } from "./follow-up-name";
import type { TrackedKind } from "./tracked-kind";
import { TRACKED_KINDS } from "./tracked-kinds";

const FOLLOW_UP_SYMBOLS = {
  ...TRACKED_KINDS.question.followUps,
  ...TRACKED_KINDS.quest.followUps,
} satisfies Record<FollowUpName, string>;

export function followUpSymbolOf(name: FollowUpName): string {
  return FOLLOW_UP_SYMBOLS[name];
}

export const FOLLOW_UP_SYMBOL_LIST: string[] = FOLLOW_UP_NAMES.map(followUpSymbolOf);

const NAMES_BY_SYMBOL = new Map<string, FollowUpName>(FOLLOW_UP_NAMES.map((name) => [followUpSymbolOf(name), name]));

export function followUpNamedBy(symbol: string): FollowUpName | undefined {
  return NAMES_BY_SYMBOL.get(symbol);
}

export function kindFollowsUpWith(kind: TrackedKind, name: FollowUpName): boolean {
  return kind.followUps[name] !== undefined;
}
