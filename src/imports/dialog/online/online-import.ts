import { Refusal } from "../../../beyond/shape/refusal";
import type { PrintedSheet } from "../../../beyond/sheet/printed-sheet";
import type { BeyondCalls } from "../../../online/call-rules";
import { CharacterId } from "../../../online/character-id";
import type { FirstPress } from "../../agreement/first-press";
import { NOTHING_SENT } from "../import-words";
import { onlineSheetOf } from "./online-sheet";
import type { OnlineSource } from "./online-source";

export class OnlineImport implements OnlineSource {
  constructor(
    private readonly firstPress: FirstPress,
    private readonly calls: BeyondCalls,
  ) {}

  async sheetFor(link: string): Promise<PrintedSheet> {
    const id = CharacterId.of(link);
    const answer = await this.firstPress.answer();
    if (!answer.agreed) throw new Refusal(NOTHING_SENT);
    return onlineSheetOf(await this.calls.characterFor(id));
  }
}
