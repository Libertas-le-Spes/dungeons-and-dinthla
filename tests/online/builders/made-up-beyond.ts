import type { BeyondReply } from "../../../src/online/beyond-reply";
import { CharacterId } from "../../../src/online/character-id";
import { MadeUpReply } from "../../beyond/builders/made-up-reply";

export const MADE_UP_NUMBER = "4242";

export function madeUpId(): CharacterId {
  return CharacterId.of(MADE_UP_NUMBER);
}

export function goodReply(): BeyondReply {
  return { status: 200, contentType: "application/json; charset=utf-8", text: MadeUpReply.levelOneMonk().wholeText() };
}

export function replyWith(change: Partial<BeyondReply>): BeyondReply {
  return { ...goodReply(), ...change };
}
