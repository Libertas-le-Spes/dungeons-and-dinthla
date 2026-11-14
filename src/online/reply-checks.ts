import { readReply } from "../beyond/reply/read-reply";
import type { RepliedCharacter } from "../beyond/reply/replied-character";
import { Refusal } from "../beyond/shape/refusal";
import type { BeyondReply } from "./beyond-reply";
import type { CharacterId } from "./character-id";
import { A_DIFFERENT_CHARACTER, NO_SUCH_CHARACTER, NOT_A_CHARACTER, NOT_PUBLIC } from "./online-words";

const OK = 200;
const JSON_TYPE = "application/json";

const REFUSED_STATUSES = new Map<number, string>([
  [403, NOT_PUBLIC],
  [404, NO_SUCH_CHARACTER],
]);

function refuseStatus(status: number): void {
  if (status === OK) return;
  const words = REFUSED_STATUSES.get(status);
  if (words !== undefined) throw new Refusal(words);
  throw new Refusal(NOT_A_CHARACTER);
}

function refuseType(contentType: string): void {
  if (contentType.toLowerCase().startsWith(JSON_TYPE)) return;
  throw new Refusal(NOT_A_CHARACTER);
}

export function checkedReply(reply: BeyondReply, asked: CharacterId): RepliedCharacter {
  refuseStatus(reply.status);
  refuseType(reply.contentType);
  const replied = readReply(reply.text);
  if (!asked.isNumber(replied.id)) throw new Refusal(A_DIFFERENT_CHARACTER);
  return replied;
}
