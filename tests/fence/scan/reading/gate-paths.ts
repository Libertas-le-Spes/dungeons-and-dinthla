import { SOURCE_FOLDER } from "./scan-paths";

const GATE_FOLDER = `${SOURCE_FOLDER}fence/gate/`;
const GATE_SOURCES = [`${GATE_FOLDER}fenced-files.ts`, `${GATE_FOLDER}fenced-metadata.ts`];
const GATE_BUILT_SOURCES = [...GATE_SOURCES, `${GATE_FOLDER}fenced-file-actions.ts`, `${GATE_FOLDER}gatekeeper.ts`, `${GATE_FOLDER}held-files.ts`];
export const GATE_TYPE_SOURCES = [...GATE_BUILT_SOURCES, `${SOURCE_FOLDER}fence/paths/fence.ts`];

export function isInGateFolder(path: string): boolean {
  return path.startsWith(GATE_FOLDER);
}

export function isGateSource(path: string): boolean {
  return GATE_SOURCES.includes(path);
}

export function isGateBuiltSource(path: string): boolean {
  return GATE_BUILT_SOURCES.includes(path);
}

export function isGateTypeSource(path: string): boolean {
  return GATE_TYPE_SOURCES.includes(path);
}

const CORE_FENCE_FOLDER = `${SOURCE_FOLDER}fence/notes/`;
const REPORT_SOURCES = [`${GATE_FOLDER}written-notes.ts`, `${CORE_FENCE_FOLDER}write-report.ts`];

export function isReportSource(path: string): boolean {
  return REPORT_SOURCES.includes(path);
}

export function isInCoreFenceFolder(path: string): boolean {
  return path.startsWith(CORE_FENCE_FOLDER);
}
