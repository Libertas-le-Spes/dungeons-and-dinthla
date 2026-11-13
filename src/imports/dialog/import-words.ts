export const IMPORT_TITLE = "Import from D&D Beyond";
export const UPDATE_TITLE = "Update from D&D Beyond";
export const WHERE_THE_PDF_IS = "On D&D Beyond: open your character, choose Manage next to the name, then Export to PDF at the bottom of the menu. Then choose that file here.";
export const CHOOSE_A_FILE = "Character PDF";
export const READING = "Reading the file…";
export const STILL_READING = "Still reading the first file.";
export const TYPED_TEXT_WARNING = "Text you typed inside these sections will be replaced:";
export const NOTHING_CHANGES = "Nothing in the note would change.";
export const CHOOSE_THE_NOTE = "Which note is this character?";
export const WRITE_FAILED = "Couldn't write the import";
export const NO_CAMPAIGN = "Open a campaign first, then import its character.";
export const NOT_IN_A_CAMPAIGN = "This note isn't in a campaign, so it can't be updated from D&D Beyond.";
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
  return `This file is bigger than ${mostBytes / BYTES_IN_A_MEGABYTE} MB, so it was not read.`;
}

export const FILE_NOT_READ = "The file could not be read, so nothing was imported.";

export function notThisCharacter(pdfName: string, sheetName: string): string {
  return `This PDF is for ${pdfName}, not ${sheetName}. Nothing was changed.`;
}
