import { requestUrl } from "obsidian";
import type { BeyondCall, BeyondReplyText } from "../../host/online/beyond-call";
import { beyondAddressOf } from "../../online/beyond-address";
import type { CharacterId } from "../../online/character-id";
import { headerValue } from "../../online/header-value";

class ObsidianBeyondCall implements BeyondCall {
  async get(id: CharacterId): Promise<BeyondReplyText> {
    const reply = await requestUrl({ url: beyondAddressOf(id), method: "GET", throw: false });
    return { status: reply.status, contentType: headerValue(reply.headers, "content-type"), text: reply.text };
  }
}

export const OBSIDIAN_BEYOND_CALL: BeyondCall = new ObsidianBeyondCall();
