import type { SheetValue } from "../../reading/character-sheet";

export function addImportedLines(parent: HTMLElement, value: SheetValue): void {
  const imported = value.imported;
  if (value.state !== "imported" || imported === null) return;
  if (imported.working !== "") parent.createDiv({ cls: "dd-value-working", text: imported.working });
  parent.createDiv({ cls: "dd-value-route", text: imported.route });
}
