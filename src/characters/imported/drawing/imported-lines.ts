export interface ImportedShown {
  readonly working: string;
  readonly route: string;
}

export interface ShownValue {
  readonly state: string;
  readonly imported: ImportedShown | null;
}

export function addImportedLines(parent: HTMLElement, value: ShownValue): void {
  const imported = value.imported;
  if (value.state !== "imported" || imported === null) return;
  if (imported.working !== "") parent.createDiv({ cls: "dd-value-working", text: imported.working });
  parent.createDiv({ cls: "dd-value-route", text: imported.route });
}
