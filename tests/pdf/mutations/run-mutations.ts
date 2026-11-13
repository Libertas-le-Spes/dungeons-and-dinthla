import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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

interface Outcome {
  id: string;
  group: string;
  status: string;
  failed: number;
  examples: string[];
}

const LIMITS = { memoryMax: "4G", seconds: 120 };
const SUITES = ["tests/pdf", "tests/build/inner-folders.test.ts"];
const ROOT = new URL("../../..", import.meta.url).pathname;
const MUTATIONS: Mutation[] = JSON.parse(readFileSync(new URL("./mutations.json", import.meta.url), "utf8"));
const ONLY_ANCHORS = process.argv.includes("--anchors");
const WANTED = process.argv.filter(isMutationId);
const REPORT_FOLDER = mkdtempSync(join(tmpdir(), "pdf-mutations-"));

function isMutationId(argument: string): boolean {
  return MUTATIONS.some((mutation) => mutation.id === argument);
}

function statusOf(failed: string[]): string {
  if (failed.length > 0) return "killed";
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

function failedNames(suites: SuiteResult[]): string[] {
  const names: string[] = [];
  for (const suite of suites) {
    for (const test of suite.assertionResults) {
      if (test.status === "failed") names.push(test.fullName);
    }
    if (suite.status === "failed" && suite.assertionResults.length === 0) names.push(`SUITE FAILED TO LOAD: ${suite.name}`);
  }
  return names;
}

function runMutated(path: string, original: string, mutation: Mutation): SuiteResult[] | null {
  writeFileSync(path, original.replace(mutation.find, () => mutation.replace));
  try {
    return runTests();
  } finally {
    writeFileSync(path, original);
  }
}

function outcomeOf(mutation: Mutation): Outcome {
  const path = join(ROOT, mutation.file);
  const text = readFileSync(path, "utf8");
  const found = occurrences(text, mutation.find);
  const outcome: Outcome = { id: mutation.id, group: mutation.group, status: `ANCHOR ${found}`, failed: 0, examples: [] };
  if (found !== 1 || ONLY_ANCHORS) return outcome;
  const suites = runMutated(path, text, mutation);
  if (suites === null) return { ...outcome, status: "NO REPORT" };
  const failed = failedNames(suites);
  return { ...outcome, status: statusOf(failed), failed: failed.length, examples: firstThree(failed) };
}

if (!ONLY_ANCHORS) assertMemoryBox();

for (const mutation of MUTATIONS) {
  if (WANTED.length > 0 && !WANTED.includes(mutation.id)) continue;
  const outcome = outcomeOf(mutation);
  console.log(JSON.stringify(outcome));
}
console.log("finished");
