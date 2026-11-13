import { readFileSync } from "node:fs";

export interface Mutation {
  id: string;
  file: string;
  find: string;
  replace: string;
  group: string;
}

export interface Choice {
  anchorsOnly: boolean;
  allowDirty: boolean;
  wanted: string[];
  unknown: string[];
  unknownFlags: string[];
}

const FIRST_GIVEN_ARGUMENT = 2;
const FLAG_START = "--";
const ANCHORS = "--anchors";
const ALLOW_DIRTY = "--allow-dirty";
const KNOWN_FLAGS = [ANCHORS, ALLOW_DIRTY];

export function mutationsAt(url: URL): Mutation[] {
  return JSON.parse(readFileSync(url, "utf8"));
}

function isIdIn(mutations: readonly Mutation[], argument: string): boolean {
  for (const mutation of mutations) {
    if (mutation.id === argument) return true;
  }
  return false;
}

export function givenArguments(argv: readonly string[]): string[] {
  const given: string[] = [];
  for (const [position, argument] of argv.entries()) {
    if (position >= FIRST_GIVEN_ARGUMENT) given.push(argument);
  }
  return given;
}

export function choiceOf(given: readonly string[], mutations: readonly Mutation[]): Choice {
  const choice: Choice = { anchorsOnly: given.includes(ANCHORS), allowDirty: given.includes(ALLOW_DIRTY), wanted: [], unknown: [], unknownFlags: [] };
  for (const argument of given) {
    if (KNOWN_FLAGS.includes(argument)) continue;
    if (argument.startsWith(FLAG_START)) {
      choice.unknownFlags.push(argument);
      continue;
    }
    if (isIdIn(mutations, argument)) choice.wanted.push(argument);
    else choice.unknown.push(argument);
  }
  return choice;
}

export function isChosen(choice: Choice, mutation: Mutation): boolean {
  if (choice.wanted.length === 0) return true;
  return choice.wanted.includes(mutation.id);
}

export function occurrences(text: string, find: string): number {
  return text.split(find).length - 1;
}

export function targetFiles(mutations: readonly Mutation[]): string[] {
  const files: string[] = [];
  for (const mutation of mutations) {
    if (!files.includes(mutation.file)) files.push(mutation.file);
  }
  return files;
}
