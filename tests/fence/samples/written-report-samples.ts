const IMPORT = 'import type { NoteReporter } from "../../../../src/fence/gate/written-notes";\n';

export const REPORT_TELLING_SAMPLES = [
  `${IMPORT}export const tell = (reporter: NoteReporter) => reporter.textSaved("D&D/Pale Moon/Sessions/Session 1.md", "text");`,
  `${IMPORT}export const tell = (reporter: NoteReporter) => reporter.renamed("D&D/Pale Moon/Funds/Session 1.md", "D&D/Pale Moon/Funds/Session 2.md");`,
  `${IMPORT}export const tell = (reporter: NoteReporter) => reporter.trashed("D&D/Pale Moon/Funds/Session 1.md");`,
  `${IMPORT}export function tell(reporter: Pick<NoteReporter, "renamed">) {\n  reporter.renamed("D&D/Pale Moon/Funds/Session 1.md", "D&D/Pale Moon/Funds/Session 2.md");\n}`,
];

export const REPORT_HARMLESS_SAMPLES = [
  'import type { WrittenNotes } from "../../../../src/fence/gate/written-notes";\nexport const hear = (notes: WrittenNotes) => notes.listen({ textSaved() {}, trashed() {}, renamed() {} });',
  "export const tell = (bell: { textSaved(path: string): void }) => bell.textSaved(\"x\");",
  "export const tell = (bell: { renamed(path: string): void; trashed(path: string): void }) => {\n  bell.renamed(\"x\");\n  bell.trashed(\"x\");\n};",
];
