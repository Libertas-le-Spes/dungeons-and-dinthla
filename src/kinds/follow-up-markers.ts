import type { FollowUpKind } from "../notes/follow-up";
import type { SourceKind } from "./source-kind";
import { SOURCE_KINDS } from "./source-kinds";

const KINDS_FOLLOWED_UP = new Map<FollowUpKind, SourceKind>();
const FOLLOW_UPS_BY_SYMBOL = new Map<string, FollowUpKind>();

for (const kind of SOURCE_KINDS) {
  for (const followUp of kind.followUps) {
    KINDS_FOLLOWED_UP.set(followUp.kind, kind);
    FOLLOW_UPS_BY_SYMBOL.set(followUp.symbol, followUp.kind);
  }
}

export function followUpKindOf(symbol: string): FollowUpKind | undefined {
  return FOLLOW_UPS_BY_SYMBOL.get(symbol);
}

export function kindFollowedUpBy(kind: FollowUpKind): SourceKind {
  return KINDS_FOLLOWED_UP.get(kind)!;
}
