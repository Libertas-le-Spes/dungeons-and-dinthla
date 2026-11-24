import type { ElementParts } from "../../../views/elements/element-parts";
import { ObsidianWiring } from "./obsidian-wiring";

function setTextParts(el: HTMLElement, parts: ElementParts): void {
  if (parts.cls !== undefined && parts.cls.length > 0) el.addClass(...parts.cls);
  if (parts.text !== undefined) el.setText(parts.text);
  if (parts.hidden === true) el.toggle(false);
}

function setReaderParts(el: HTMLElement, parts: ElementParts): void {
  if (parts.role !== undefined) el.setAttr("role", parts.role);
  if (parts.label !== undefined) el.setAttr("aria-label", parts.label);
  if (parts.labelledBy !== undefined) el.setAttr("aria-labelledby", parts.labelledBy);
  if (parts.live !== undefined) el.setAttr("aria-live", parts.live);
  if (parts.current !== undefined) el.setAttr("aria-current", parts.current);
  if (parts.selected !== undefined) el.setAttr("aria-selected", String(parts.selected));
  if (parts.pressed !== undefined) el.setAttr("aria-pressed", String(parts.pressed));
  if (parts.controls !== undefined) el.setAttr("aria-controls", parts.controls);
  if (parts.hasPopup !== undefined) el.setAttr("aria-haspopup", parts.hasPopup);
  if (parts.hiddenFromReaders === true) el.setAttr("aria-hidden", "true");
}

function setPlainParts(el: HTMLElement, parts: ElementParts): void {
  if (parts.tabIndex !== undefined) el.setAttr("tabindex", String(parts.tabIndex));
  if (parts.id !== undefined) el.setAttr("id", parts.id);
  if (parts.title !== undefined) el.setAttr("title", parts.title);
  if (parts.dataPath !== undefined) el.setAttr("data-path", parts.dataPath);
  if (parts.dataLine !== undefined) el.setAttr("data-line", String(parts.dataLine));
  if (parts.dataName !== undefined) el.setAttr("data-name", parts.dataName);
  if (parts.dataItem !== undefined) el.setAttr("data-item", parts.dataItem);
  if (parts.dataState !== undefined) el.setAttr("data-state", parts.dataState);
  if (parts.undraggable === true) el.setAttr("draggable", "false");
}

export function partsOn(el: HTMLElement, parts: ElementParts): HTMLElement {
  setTextParts(el, parts);
  setReaderParts(el, parts);
  setPlainParts(el, parts);
  if (parts.bindings === undefined) return el;
  const wiring = new ObsidianWiring(el);
  for (const binding of parts.bindings) binding.wireOn(wiring);
  return el;
}
