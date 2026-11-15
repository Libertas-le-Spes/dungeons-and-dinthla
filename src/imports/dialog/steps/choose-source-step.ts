import { OR_THE_PDF, PDF_EXPORT_HINT, PDF_GAPS_NOTE } from "../import-words";
import type { OnlineBlock } from "../online/online-block";
import type { PickedPdf } from "../picking/picked-pdf";
import { PdfPicker } from "../picking/pdf-picker";
import type { PendingWork } from "../../../views/pending/pending-work";

export interface SourceParts {
  readonly refusal: string | null;
  readonly online: OnlineBlock;
  readonly picked: PickedPdf;
  readonly work: PendingWork;
}

export function drawChooseSource(parent: HTMLElement, parts: SourceParts): void {
  if (parts.refusal !== null) parent.createEl("p", { cls: "dd-import-refusal", text: parts.refusal, attr: { role: "alert" } });
  parts.online.draw(parent);
  parent.createEl("p", { cls: "dd-or-the-pdf", text: OR_THE_PDF });
  parent.createEl("p", { cls: "dd-where", text: PDF_EXPORT_HINT });
  parent.createEl("p", { cls: "dd-where", text: PDF_GAPS_NOTE });
  new PdfPicker(parent.createDiv({ cls: "dd-import-pick" }), parts.picked, parts.work);
}
