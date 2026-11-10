import type { Allowances } from "./allowances";

export function isNeverAllowed(): boolean {
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
};

export const LOOSE_CASTS_ALLOWED: Allowances = { ...NOTHING_ALLOWED, looseCasts: isAlwaysAllowed };
