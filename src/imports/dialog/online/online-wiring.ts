import type { App } from "obsidian";
import type { BeyondCall } from "../../../host/online/beyond-call";
import { BeyondCalls } from "../../../online/call-rules";
import { agreementDialogIn } from "../../agreement/agreement-dialog";
import type { KeptAgreement } from "../../agreement/kept-agreement";
import { FirstPress } from "../../agreement/first-press";
import { OnlineImport } from "./online-import";

export function onlineImportFor(app: App, agreement: KeptAgreement, beyond: BeyondCall): OnlineImport {
  return new OnlineImport(new FirstPress(agreement, agreementDialogIn(app)), new BeyondCalls(beyond.get.bind(beyond), () => Date.now()));
}
