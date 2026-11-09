import { normalizePath } from "obsidian";

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

function isAsObsidianWritesIt(path: string): boolean {
  return normalizePath(path) === path;
}

function isPlainPart(part: string): boolean {
  return part !== "" && part !== "." && part !== "..";
}

function hasOnlyPlainParts(path: string): boolean {
  return path.split("/").every(isPlainPart);
}

const PATH_RULES: PathRule[] = [
  isWritten,
  startsInsideTheVault,
  usesOnlyForwardSlashes,
  holdsNoNullCharacter,
  isAsObsidianWritesIt,
  hasOnlyPlainParts,
];

export function isSafePath(path: unknown): path is string {
  if (typeof path !== "string") return false;
  return PATH_RULES.every((rule) => rule(path));
}
