export const IMPORT_TITLE = "Import from D&D Beyond";
export const UPDATE_TITLE = "Update from D&D Beyond";
export const LINK_LABEL = "Link or number";
export const BRING_IN_BUTTON = "Bring in from D&D Beyond";
export const ASKING = "Asking D&D Beyond…";
export const NOTHING_SENT = "Nothing was sent.";
export const OR_THE_PDF = "Or choose a PDF.";
export const PDF_EXPORT_HINT = "Manage, then Export to PDF.";
export const PDF_GAPS_NOTE = "PDF lacks attacks and proficiency marks.";
export const CHOOSE_A_FILE = "Character PDF";
export const READING = "Reading the file…";
export const STILL_READING = "Still reading the first file.";
export function typedTextWords(titles: readonly string[]): string {
  return `Your typed text is replaced in ${titles.join(", ")}.`;
}

export const IMPORT_MARKS_CHANGE = "Changes: import marks.";
export const NOTHING_CHANGES = "Nothing changes.";
export const CHOOSE_THE_NOTE = "Which note is this character?";
export const WRITE_FAILED = "Couldn't write the import";
export const NO_CAMPAIGN = "Open a campaign first, then import its character.";
export const NOT_IN_A_CAMPAIGN = "This note isn't in a campaign.";
export const IMPORT_BUTTON = "Import";
export const UPDATE_BUTTON = "Update";
export const CLOSE_BUTTON = "Close";
export const CHOOSE_ANOTHER = "Choose another file";

export function newNoteWords(name: string): string {
  return `Make a new note, ${name}`;
}

export function existingNoteWords(name: string): string {
  return `Update ${name}`;
}

const BYTES_IN_A_MEGABYTE = 1024 * 1024;

export function fileTooBig(mostBytes: number): string {
  return `The file is over ${mostBytes / BYTES_IN_A_MEGABYTE} MB. Choose a smaller one.`;
}

export const FILE_NOT_READ = "Couldn't read the file. Try another.";

export function notThisCharacter(pdfName: string, sheetName: string): string {
  return `That is ${pdfName}, not ${sheetName}.`;
}
