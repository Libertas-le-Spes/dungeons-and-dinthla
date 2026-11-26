import type { CharacterId } from "../../online/character-id";

export interface BeyondReplyText {
  readonly status: number;
  readonly contentType: string;
  readonly text: string;
}

export interface BeyondCall {
  get(id: CharacterId): Promise<BeyondReplyText>;
}
