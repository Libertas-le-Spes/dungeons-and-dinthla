import { followUpKindOf } from "../kinds/follow-up-markers";
import { withoutBullet } from "./bullet";

export type FollowUpKind = "clue" | "answer" | "progress" | "completed" | "failed";

export interface FollowUp {
  kind: FollowUpKind;
  text: string;
}

const FOLLOW_UP = /^(\?[+=]|![+=]|!x(?=\s|$))(.*)$/;

export function isFollowUp(text: string): boolean {
  return FOLLOW_UP.test(text);
}

export function readFollowUp(line: string): FollowUp | null {
  const match = FOLLOW_UP.exec(withoutBullet(line));
  if (match === null) return null;
  const [, marker, text] = match;
  const kind = followUpKindOf(marker!);
  if (kind === undefined) return null;
  return { kind, text: text!.trim() };
}
