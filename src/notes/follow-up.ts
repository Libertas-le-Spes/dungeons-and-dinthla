import { withoutBullet } from "./marker";

export type FollowUpKind = "clue" | "answer" | "progress" | "completed" | "failed";

export interface FollowUp {
  kind: FollowUpKind;
  text: string;
}

const FOLLOW_UP = /^(\?[+=]|![+=]|!x(?=\s|$))(.*)$/;

const KINDS: Record<string, FollowUpKind> = {
  "?+": "clue",
  "?=": "answer",
  "!+": "progress",
  "!=": "completed",
  "!x": "failed",
};

export function readFollowUp(line: string): FollowUp | null {
  const match = FOLLOW_UP.exec(withoutBullet(line));
  if (match === null) return null;
  const [, marker, text] = match;
  return { kind: KINDS[marker!]!, text: text!.trim() };
}
