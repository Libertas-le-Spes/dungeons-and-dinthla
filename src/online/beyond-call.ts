import { requestUrl } from "obsidian";
import { beyondAddressOf } from "./beyond-address";
import type { BeyondReply } from "./beyond-reply";
import { headerValue } from "./header-value";
import type { CharacterId } from "./character-id";


export async function callBeyond(id: CharacterId): Promise<BeyondReply> {
  const reply = await requestUrl({ url: beyondAddressOf(id), method: "GET", throw: false });
  return { status: reply.status, contentType: headerValue(reply.headers, "content-type"), text: reply.text };
}
