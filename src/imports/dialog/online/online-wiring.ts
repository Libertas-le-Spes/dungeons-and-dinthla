import type { App } from "obsidian";
import { callBeyond } from "../../../online/beyond-call";
import { BeyondCalls } from "../../../online/call-rules";
import { agreementDialogIn } from "../../agreement/agreement-dialog";
import type { DeviceAgreement } from "../../agreement/device-agreement";
import { FirstPress } from "../../agreement/first-press";
import { OnlineImport } from "./online-import";

export function onlineImportFor(app: App, device: DeviceAgreement): OnlineImport {
  return new OnlineImport(new FirstPress(device, agreementDialogIn(app)), new BeyondCalls(callBeyond, () => Date.now()));
}
