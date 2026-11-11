import { ATTRIBUTES, ELEMENT_OPTIONS, TAGS } from "../../allowed/page";
import type { Allowances } from "../reading/allowances";

export function isPageTag(_path: string, name: string): boolean {
  return TAGS.includes(name);
}

export function isPageAttribute(_path: string, name: string): boolean {
  return ATTRIBUTES.includes(name);
}

export function isPageOption(_path: string, name: string): boolean {
  return ELEMENT_OPTIONS.includes(name);
}

export function isNeverAllowed(): boolean {
  return false;
}

export function isAnyNameAllowed(): boolean {
  return true;
}

export function isNoNameAllowed(): boolean {
  return false;
}

export function isAlwaysAllowed(): boolean {
  return true;
}

export const NOTHING_ALLOWED: Allowances = {
  vault: isNeverAllowed,
  keyReading: isNeverAllowed,
  editorReading: isNeverAllowed,
  fileTree: isNeverAllowed,
  looseCasts: isNeverAllowed,
  noteReading: isNeverAllowed,
  codeMirror: isNeverAllowed,
  fileOpening: isNeverAllowed,
  viewState: isNeverAllowed,
  activeFile: isNeverAllowed,
  activeView: isNeverAllowed,
  eventTrigger: isNeverAllowed,
  leafView: isNeverAllowed,
  viewFile: isNeverAllowed,
  noteEvents: isNeverAllowed,
  gateBuilding: isNeverAllowed,
  obsidianImports: isAnyNameAllowed,
  globals: isAnyNameAllowed,
  postProcessing: isNeverAllowed,
  pageMembers: isAnyNameAllowed,
  computedKeys: isNeverAllowed,
  pageText: isNeverAllowed,
  elementQueries: isNeverAllowed,
  tags: isPageTag,
  attributes: isPageAttribute,
  elementOptions: isPageOption,
};

export const ALL_ALLOWED: Allowances = {
  vault: isAlwaysAllowed,
  keyReading: isAlwaysAllowed,
  editorReading: isAlwaysAllowed,
  fileTree: isAlwaysAllowed,
  looseCasts: isAlwaysAllowed,
  noteReading: isAlwaysAllowed,
  codeMirror: isAlwaysAllowed,
  fileOpening: isAlwaysAllowed,
  viewState: isAlwaysAllowed,
  activeFile: isAlwaysAllowed,
  activeView: isAlwaysAllowed,
  eventTrigger: isAlwaysAllowed,
  leafView: isAlwaysAllowed,
  viewFile: isAlwaysAllowed,
  noteEvents: isAlwaysAllowed,
  gateBuilding: isAlwaysAllowed,
  obsidianImports: isAnyNameAllowed,
  globals: isAnyNameAllowed,
  postProcessing: isAlwaysAllowed,
  pageMembers: isAnyNameAllowed,
  computedKeys: isAlwaysAllowed,
  pageText: isAlwaysAllowed,
  elementQueries: isAlwaysAllowed,
  tags: isPageTag,
  attributes: isPageAttribute,
  elementOptions: isPageOption,
};

export const LOOSE_CASTS_ALLOWED: Allowances = { ...NOTHING_ALLOWED, looseCasts: isAlwaysAllowed };
