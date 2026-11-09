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

function isPlainPart(part: string): boolean {
  return part !== "" && part !== "." && part !== "..";
}

function hasOnlyPlainParts(path: string): boolean {
  return path.split("/").every(isPlainPart);
}

function isAsObsidianWritesIt(path: string): boolean {
  return normalizePath(path) === path;
}

const PATH_RULES: PathRule[] = [isWritten, startsInsideTheVault, usesOnlyForwardSlashes, holdsNoNullCharacter, hasOnlyPlainParts];

const NEW_PATH_RULES: PathRule[] = [isAsObsidianWritesIt];

export function isSafePath(path: unknown): path is string {
  if (typeof path !== "string") return false;
  return PATH_RULES.every((rule) => rule(path));
}

export function isSafeNewPath(path: unknown): path is string {
  if (!isSafePath(path)) return false;
  return NEW_PATH_RULES.every((rule) => rule(path));
}
