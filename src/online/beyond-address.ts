import type { CharacterId } from "./character-id";

export const BEYOND_ADDRESS = "https://character-service.dndbeyond.com/character/v5/character/";

export function beyondAddressOf(id: CharacterId): string {
  return id.appendedTo(BEYOND_ADDRESS);
}
