import { withoutBullet } from "./bullet";

export type FollowUpKind = "clue" | "answer" | "progress" | "completed" | "failed";

export interface FollowUp {
  kind: FollowUpKind;
  text: string;
}

type FollowUpMarker = "?+" | "?=" | "!+" | "!=" | "!x";

const FOLLOW_UP = /^(\?[+=]|![+=]|!x(?=\s|$))(.*)$/;

const KINDS: Record<FollowUpMarker, FollowUpKind> = {
  "?+": "clue",
  "?=": "answer",
  "!+": "progress",
  "!=": "completed",
  "!x": "failed",
};

export function isFollowUp(text: string): boolean {
  return FOLLOW_UP.test(text);
}

export function readFollowUp(line: string): FollowUp | null {
  const match = FOLLOW_UP.exec(withoutBullet(line));
  if (match === null) return null;
  const [, marker, text] = match;
  return { kind: KINDS[marker as FollowUpMarker], text: text!.trim() };
}
