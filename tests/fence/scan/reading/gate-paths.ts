import { SOURCE_FOLDER } from "./scan-paths";

const GATE_FOLDER = `${SOURCE_FOLDER}fence/gate/`;
const GATE_SOURCES = [`${GATE_FOLDER}fenced-files.ts`, `${GATE_FOLDER}fenced-metadata.ts`];
const GATE_BUILT_SOURCES = [...GATE_SOURCES, `${GATE_FOLDER}fenced-file-actions.ts`, `${GATE_FOLDER}gatekeeper.ts`, `${GATE_FOLDER}held-files.ts`];
const GATE_TYPE_SOURCES = [...GATE_BUILT_SOURCES, `${SOURCE_FOLDER}fence/paths/fence.ts`];

export const NAMED_GATE_FILES = GATE_TYPE_SOURCES;

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
