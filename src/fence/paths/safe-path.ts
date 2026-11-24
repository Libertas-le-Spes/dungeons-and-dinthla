import type { PathSpelling } from "../../host/rules/path-spelling";
import { isTrimmedByWindows, refusalForFileName } from "../../names/file-name";

const DRIVE_LETTER = /^[A-Za-z]:/;

type PathRule = (path: string) => boolean;

function isWritten(path: string): boolean {
  return path !== "";
}

function startsInsideTheVault(path: string): boolean {
  return !path.startsWith("/") && !DRIVE_LETTER.test(path);
}

function usesOnlyForwardSlashes(path: string): boolean {
  return !path.includes("\\");
}

function holdsNoNullCharacter(path: string): boolean {
  return !path.includes("\0");
}

function isPlainPart(part: string): boolean {
  return part !== "" && part !== "." && part !== "..";
}

function hasOnlyPlainParts(path: string): boolean {
  return path.split("/").every(isPlainPart);
}

function keepsItsNameOnWindows(part: string): boolean {
  return !isTrimmedByWindows(part);
}

function hasOnlyPartsWindowsKeeps(path: string): boolean {
  return path.split("/").every(keepsItsNameOnWindows);
}


export function refusalForPathParts(path: string): string | null {
  for (const part of path.split("/")) {
    const refusal = refusalForFileName(part);
    if (refusal !== null) return refusal;
  }
  return null;
}

function hasOnlyNameableParts(path: string): boolean {
  return refusalForPathParts(path) === null;
}

const PATH_RULES: PathRule[] = [isWritten, startsInsideTheVault, usesOnlyForwardSlashes, holdsNoNullCharacter, hasOnlyPlainParts, hasOnlyPartsWindowsKeeps];


export function isSafePath(path: unknown): path is string {
  if (typeof path !== "string") return false;
  return PATH_RULES.every((rule) => rule(path));
}

export function isSafeNewPath(path: unknown, spelling: PathSpelling): path is string {
  if (!isSafePath(path)) return false;
  if (spelling.storedSpellingOf(path) !== path) return false;
  return hasOnlyNameableParts(path);
}
