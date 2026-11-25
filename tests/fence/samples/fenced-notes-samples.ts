export const FENCED_NOTES_BUILDING_SAMPLE =
  'import { FencedNotes } from "../../../../src/fence/notes/fenced-notes";\nimport type { Fence } from "../../../../src/fence/paths/fence";\nimport type { HostNotes } from "../../../../src/host/host";\nimport type { WriteReport } from "../../../../src/fence/notes/write-report";\nexport const fenced = (raw: HostNotes, fence: Fence, report: WriteReport) => new FencedNotes(raw, fence, report);';

export const FENCED_NOTES_CASTING_SAMPLES = [
  'import type { FencedNotes } from "../../../../src/fence/notes/fenced-notes";\nexport const fenced = (raw: object) => raw as FencedNotes;',
  'import type { FencedNotes } from "../../../../src/fence/notes/fenced-notes";\nexport const fenced = (raw: object) => <FencedNotes>raw;',
];
