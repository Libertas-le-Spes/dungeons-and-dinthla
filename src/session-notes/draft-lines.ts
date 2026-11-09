import { readLookup } from "../lookups/lookup";

function isLookup(line: string): boolean {
  return readLookup(line) !== null;
}

function isBlank(line: string): boolean {
  return line.trim() === "";
}

function isLineToSave(line: string): boolean {
  return !isBlank(line) && !isLookup(line);
}

function trimmed(line: string): string {
  return line.trim();
}

function boxLinesOf(text: string): string[] {
  return text.split("\n");
}

export function linesToSave(text: string): string[] {
  return boxLinesOf(text).filter(isLineToSave).map(trimmed);
}

export function hasLinesToSave(text: string): boolean {
  return boxLinesOf(text).some(isLineToSave);
}

export function lookupLinesLeft(text: string): string {
  return boxLinesOf(text).filter(isLookup).join("\n");
}
