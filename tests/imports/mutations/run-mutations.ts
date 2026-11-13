import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { assertMemoryBox, boxedTestRun } from "../../mutation-support/boxed-test-run.ts";
import type { SuiteResult } from "../../mutation-support/suite-results.ts";

interface Mutation {
  id: string;
  file: string;
  find: string;
  replace: string;
  group: string;
}

interface Backup {
  file: string;
  text: string;
}

interface Failures {
  assertions: string[];
  loads: string[];
}

interface Outcome {
  id: string;
  group: string;
  status: string;
  failed: number;
  loadFailures: number;
  examples: string[];
}

const LIMITS = { memoryMax: "2G", seconds: 120 };
const SUITES = ["tests/imports", "tests/build/inner-folders.test.ts", "tests/build/note-folders.test.ts"];
const ROOT = new URL("../../..", import.meta.url).pathname;
const MUTATIONS: Mutation[] = JSON.parse(readFileSync(new URL("./mutations.json", import.meta.url), "utf8"));
const ONLY_ANCHORS = process.argv.includes("--anchors");
const ALLOW_DIRTY = process.argv.includes("--allow-dirty");
const WANTED = process.argv.filter(isMutationId);
const REPORT_FOLDER = mkdtempSync(join(tmpdir(), "imports-mutations-"));
const BACKUP_FOLDER = join(tmpdir(), "imports-mutations-backups");
const LOAD_FAILURE = "SUITE FAILED TO LOAD";

function isMutationId(argument: string): boolean {
  return MUTATIONS.some(function named(mutation: Mutation): boolean {
    return mutation.id === argument;
  });
}

function backupPathOf(file: string): string {
  return join(BACKUP_FOLDER, `${file.split("/").join("__")}.json`);
}

function restoreLeftoverBackups(): void {
  if (!existsSync(BACKUP_FOLDER)) return;
  for (const name of readdirSync(BACKUP_FOLDER)) {
    const path = join(BACKUP_FOLDER, name);
    const backup: Backup = JSON.parse(readFileSync(path, "utf8"));
    writeFileSync(join(ROOT, backup.file), backup.text);
    rmSync(path);
    console.log(JSON.stringify({ restored: backup.file }));
  }
}

function targetFiles(): string[] {
  const files: string[] = [];
  for (const mutation of MUTATIONS) {
    if (!files.includes(mutation.file)) files.push(mutation.file);
  }
  return files;
}

function filesDifferingFromHead(): string[] {
  const differing: string[] = [];
  for (const file of targetFiles()) {
    const result = spawnSync("git", ["diff", "--quiet", "HEAD", "--", file], { cwd: ROOT });
    if (result.status !== 0) differing.push(file);
  }
  return differing;
}

function statusOf(failures: Failures): string {
  if (failures.assertions.length > 0) return "killed";
  if (failures.loads.length > 0) return "LOAD-ONLY";
  return "SURVIVED";
}

function firstThree(names: string[]): string[] {
  const first: string[] = [];
  for (const name of names) {
    if (first.length < 3) first.push(name);
  }
  return first;
}

function occurrences(text: string, find: string): number {
  return text.split(find).length - 1;
}

function runTests(): SuiteResult[] | null {
  return boxedTestRun({ root: ROOT, suites: SUITES, report: join(REPORT_FOLDER, "report.json"), limits: LIMITS });
}

function failuresIn(suites: SuiteResult[]): Failures {
  const failures: Failures = { assertions: [], loads: [] };
  for (const suite of suites) {
    for (const test of suite.assertionResults) {
      if (test.status === "failed") failures.assertions.push(test.fullName);
    }
    if (suite.status === "failed" && suite.assertionResults.length === 0) failures.loads.push(`${LOAD_FAILURE}: ${suite.name}`);
  }
  return failures;
}

function runMutated(path: string, original: string, file: string, mutation: Mutation): SuiteResult[] | null {
  mkdirSync(BACKUP_FOLDER, { recursive: true });
  const backup = backupPathOf(file);
  const kept: Backup = { file, text: original };
  writeFileSync(backup, JSON.stringify(kept));
  writeFileSync(path, original.split(mutation.find).join(mutation.replace));
  try {
    return runTests();
  } finally {
    writeFileSync(path, original);
    rmSync(backup);
  }
}

function outcomeOf(mutation: Mutation): Outcome {
  const path = join(ROOT, mutation.file);
  const text = readFileSync(path, "utf8");
  const found = occurrences(text, mutation.find);
  const outcome: Outcome = { id: mutation.id, group: mutation.group, status: `ANCHOR ${found}`, failed: 0, loadFailures: 0, examples: [] };
  if (found !== 1 || ONLY_ANCHORS) return outcome;
  const suites = runMutated(path, text, mutation.file, mutation);
  if (suites === null) return { ...outcome, status: "NO REPORT" };
  const failures = failuresIn(suites);
  const examples = firstThree([...failures.assertions, ...failures.loads]);
  return { ...outcome, status: statusOf(failures), failed: failures.assertions.length, loadFailures: failures.loads.length, examples };
}

function countOf(outcomes: Outcome[], status: string): number {
  let count = 0;
  for (const outcome of outcomes) {
    if (outcome.status === status) count += 1;
  }
  return count;
}

function summaryOf(outcomes: Outcome[]): string {
  const killed = countOf(outcomes, "killed");
  return JSON.stringify({ total: outcomes.length, killed, notKilled: outcomes.length - killed, loadOnly: countOf(outcomes, "LOAD-ONLY"), survived: countOf(outcomes, "SURVIVED") });
}

restoreLeftoverBackups();
if (!ONLY_ANCHORS) assertMemoryBox();
const differing = filesDifferingFromHead();
if (differing.length > 0 && !ALLOW_DIRTY && !ONLY_ANCHORS) {
  console.log(JSON.stringify({ refused: "These files differ from HEAD, so a mutation could not be told from your edit. Commit them, or pass --allow-dirty.", files: differing }));
  process.exit(2);
}

const outcomes: Outcome[] = [];
for (const mutation of MUTATIONS) {
  if (WANTED.length > 0 && !WANTED.includes(mutation.id)) continue;
  const outcome = outcomeOf(mutation);
  outcomes.push(outcome);
  console.log(JSON.stringify(outcome));
}
console.log(summaryOf(outcomes));
console.log("finished");
if (!ONLY_ANCHORS && countOf(outcomes, "killed") !== outcomes.length) process.exit(1);
