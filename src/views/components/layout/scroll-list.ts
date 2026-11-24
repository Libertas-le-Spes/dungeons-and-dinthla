import type { ElementParts } from "../../elements/element-parts";

const SCROLL_LIST_CLASS = "dd-scroll-list";

export function scrollListParts(parts: ElementParts, label: string): ElementParts {
  const cls: string[] = [];
  if (parts.cls !== undefined) cls.push(...parts.cls);
  cls.push(SCROLL_LIST_CLASS);
  return { ...parts, cls, tabIndex: 0, label };
}
