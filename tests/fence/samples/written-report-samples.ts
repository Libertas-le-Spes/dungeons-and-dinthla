const IMPORT = 'import type { NoteReporter } from "../../../../src/fence/gate/written-notes";\n';

export const REPORT_TELLING_SAMPLES = [
  `${IMPORT}export const tell = (reporter: NoteReporter) => reporter.changed("D&D/Pale Moon/Sessions/Session 1.md", "text");`,
  `${IMPORT}export const tell = (reporter: NoteReporter) => reporter.made("D&D/Pale Moon/Funds/Session 1.md");`,
  `${IMPORT}export const tell = (reporter: NoteReporter) => reporter.trashed("D&D/Pale Moon/Funds/Session 1.md");`,
  `${IMPORT}export function tell(reporter: Pick<NoteReporter, "made">) {\n  reporter.made("D&D/Pale Moon/Funds/Session 1.md");\n}`,
];

export const REPORT_HARMLESS_SAMPLES = [
  'import type { WrittenNotes } from "../../../../src/fence/gate/written-notes";\nexport const hear = (notes: WrittenNotes, heard: () => void) => notes.listen(heard);',
  "export const tell = (bell: { changed(path: string): void }) => bell.changed(\"x\");",
  "export const tell = (bell: { made(path: string): void; trashed(path: string): void }) => {\n  bell.made(\"x\");\n  bell.trashed(\"x\");\n};",
];
