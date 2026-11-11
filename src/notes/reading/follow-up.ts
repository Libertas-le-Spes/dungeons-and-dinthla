import type { FollowUpName } from "../../kinds/follow-up-name";
import { FOLLOW_UP_SYMBOL_LIST, followUpNamedBy } from "../../kinds/follow-ups";
import { symbolPatternOf } from "../../kinds/symbol-pattern";
import { withoutBullet } from "../parts/bullet";

export interface FollowUp {
  kind: FollowUpName;
  text: string;
}

const FOLLOW_UP = new RegExp(`^(${symbolPatternOf(FOLLOW_UP_SYMBOL_LIST)})(.*)$`);

export function isFollowUp(text: string): boolean {
  return FOLLOW_UP.test(text);
}

export function readFollowUp(line: string): FollowUp | null {
  const match = FOLLOW_UP.exec(withoutBullet(line));
  if (match === null) return null;
  const [, marker, text] = match;
  const kind = followUpNamedBy(marker!);
  if (kind === undefined) return null;
  return { kind, text: text!.trim() };
}
