import { OR_THE_PDF, PDF_EXPORT_HINT, PDF_GAPS_NOTE } from "../import-words";
import type { OnlineBlock } from "../online/online-block";
import type { PdfPicker } from "../picking/pdf-picker";
import { Div, Paragraph } from "../../../views/elements/kinds/containers";
import type { ViewElement } from "../../../views/elements/view-element";

export interface SourceParts {
  readonly refusal: string | null;
  readonly online: OnlineBlock;
  readonly picker: PdfPicker;
}

export function chooseSourceTrees(parts: SourceParts): ViewElement[] {
  const trees: ViewElement[] = [];
  if (parts.refusal !== null) trees.push(new Paragraph({ cls: ["dd-import-refusal"], text: parts.refusal, role: "alert" }));
  trees.push(
    parts.online.tree(),
    new Paragraph({ cls: ["dd-or-the-pdf"], text: OR_THE_PDF }),
    new Paragraph({ cls: ["dd-where"], text: PDF_EXPORT_HINT }),
    new Paragraph({ cls: ["dd-where"], text: PDF_GAPS_NOTE }),
    new Div({ cls: ["dd-import-pick"] }, [parts.picker.tree()]),
  );
  return trees;
}
