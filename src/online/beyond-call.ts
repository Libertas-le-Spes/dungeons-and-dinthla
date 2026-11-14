import { requestUrl } from "obsidian";
import { beyondAddressOf } from "./beyond-address";
import type { BeyondReply } from "./beyond-reply";
import type { CharacterId } from "./character-id";

function contentTypeOf(headers: Record<string, string>): string {
  const lower = headers["content-type"];
  if (lower !== undefined) return lower;
  const capitalised = headers["Content-Type"];
  if (capitalised !== undefined) return capitalised;
  return "";
}

export async function callBeyond(id: CharacterId): Promise<BeyondReply> {
  const reply = await requestUrl({ url: beyondAddressOf(id), method: "GET", throw: false });
  return { status: reply.status, contentType: contentTypeOf(reply.headers), text: reply.text };
}
