export interface ScrollListParts {
  element: HTMLElement;
  label: string;
}

export function makeScrollList({ element, label }: ScrollListParts): void {
  element.addClass("dd-scroll-list");
  element.setAttr("tabindex", "0");
  element.setAttr("aria-label", label);
}
