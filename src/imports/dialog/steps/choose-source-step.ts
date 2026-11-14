import { OR_THE_PDF, WHERE_THE_PDF_IS } from "../import-words";
import type { OnlineBlock } from "../online/online-block";
import type { PickedPdf } from "../picking/picked-pdf";
import { PdfPicker } from "../picking/pdf-picker";
import type { PendingWork } from "../../../views/pending/pending-work";

export function drawChooseSource(parent: HTMLElement, refusal: string | null, online: OnlineBlock, picked: PickedPdf, work: PendingWork): void {
  if (refusal !== null) parent.createEl("p", { cls: "dd-import-refusal", text: refusal, attr: { role: "alert" } });
  online.draw(parent);
  parent.createEl("p", { cls: "dd-or-the-pdf", text: OR_THE_PDF });
  parent.createEl("p", { cls: "dd-where", text: WHERE_THE_PDF_IS });
  new PdfPicker(parent.createDiv({ cls: "dd-import-pick" }), picked, work);
}
