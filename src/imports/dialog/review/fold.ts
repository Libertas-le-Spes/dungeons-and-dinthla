export function drawFold(parent: HTMLElement, title: string): HTMLElement {
  const fold = parent.createEl("details", { cls: "dd-import-fold" });
  fold.createEl("summary", { text: title });
  return fold;
}
