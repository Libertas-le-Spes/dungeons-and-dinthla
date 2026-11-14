import type { RepliedCharacter } from "../beyond/reply/replied-character";
import { Refusal } from "../beyond/shape/refusal";
import type { BeyondReply } from "./beyond-reply";
import type { CharacterId } from "./character-id";
import { COULD_NOT_REACH, STILL_WAITING, TIMED_OUT, TOO_SOON } from "./online-words";
import { checkedReply } from "./reply-checks";
import { TIME_LIMIT_MS, withinTimeLimit } from "./time-limit";

export const COOLDOWN_MS = 10_000;

export type CallBeyond = (id: CharacterId) => Promise<BeyondReply>;

export class BeyondCalls {
  private waiting = false;
  private lastPressAt: number | null = null;

  constructor(
    private readonly call: CallBeyond,
    private readonly now: () => number,
  ) {}

  async characterFor(id: CharacterId): Promise<RepliedCharacter> {
    this.refuseUnlessReady();
    this.lastPressAt = this.now();
    this.waiting = true;
    const reply = await withinTimeLimit(this.sent(id), { ms: TIME_LIMIT_MS, runOut: new Refusal(TIMED_OUT) });
    return checkedReply(reply, id);
  }

  private refuseUnlessReady(): void {
    if (this.waiting) throw new Refusal(STILL_WAITING);
    if (this.lastPressAt === null) return;
    const since = this.now() - this.lastPressAt;
    if (since >= 0 && since < COOLDOWN_MS) throw new Refusal(TOO_SOON);
  }

  private async sent(id: CharacterId): Promise<BeyondReply> {
    try {
      return await this.call(id);
    } catch {
      throw new Refusal(COULD_NOT_REACH);
    } finally {
      this.waiting = false;
    }
  }
}
