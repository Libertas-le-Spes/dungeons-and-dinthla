import { WHERE_THE_PDF_IS } from "../import-words";
import type { PickedPdf } from "../picking/picked-pdf";
import { PdfPicker } from "../picking/pdf-picker";
import type { PendingWork } from "../../../views/pending/pending-work";

export function drawChoosePdf(parent: HTMLElement, refusal: string | null, picked: PickedPdf, work: PendingWork): PdfPicker {
  if (refusal !== null) parent.createEl("p", { cls: "dd-import-refusal", text: refusal, attr: { role: "alert" } });
  parent.createEl("p", { cls: "dd-where", text: WHERE_THE_PDF_IS });
  const picker = new PdfPicker(parent.createDiv({ cls: "dd-import-pick" }), picked, work);
  picker.focus();
  return picker;
}
