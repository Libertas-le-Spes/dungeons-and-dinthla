import type { Dialogs } from "../../../views/dialogs/dialog-view";
import type { BeyondCall } from "../../../host/online/beyond-call";
import { BeyondCalls } from "../../../online/call-rules";
import { agreementDialogIn } from "../../agreement/agreement-dialog";
import type { KeptAgreement } from "../../agreement/kept-agreement";
import { FirstPress } from "../../agreement/first-press";
import { OnlineImport } from "./online-import";

export function onlineImportFor(dialogs: Dialogs, agreement: KeptAgreement, beyond: BeyondCall): OnlineImport {
  return new OnlineImport(new FirstPress(agreement, agreementDialogIn(dialogs)), new BeyondCalls(beyond.get.bind(beyond), () => Date.now()));
}
