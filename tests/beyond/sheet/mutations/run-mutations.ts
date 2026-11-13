import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

interface Mutation {
  id: string;
  file: string;
  find: string;
  replace: string;
  group: string;
}

interface TestResult {
  status: string;
  fullName: string;
}

interface SuiteResult {
  name: string;
  status: string;
  assertionResults: TestResult[];
}

interface Outcome {
  id: string;
  group: string;
  status: string;
  failed: number;
  examples: string[];
}

const BOX = ["--user", "--scope", "-q", "-p", "CPUWeight=10", "-p", "IOWeight=10", "-p", "MemoryMax=4G", "-p", "MemorySwapMax=0", "nice", "-n", "19"];
const ROOT = new URL("../../../..", import.meta.url).pathname;
const MUTATIONS: Mutation[] = JSON.parse(readFileSync(new URL("./mutations.json", import.meta.url), "utf8"));
const ONLY_ANCHORS = process.argv.includes("--anchors");
const WANTED = process.argv.filter(isMutationId);
const REPORT_FOLDER = mkdtempSync(join(tmpdir(), "sheet-mutations-"));

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
  const report = join(REPORT_FOLDER, "report.json");
  const result = spawnSync("systemd-run", [...BOX, "timeout", "-k", "5", "120", "npx", "vitest", "run", "tests/beyond/sheet", "tests/build/inner-folders.test.ts", "--maxWorkers=1", "--reporter=json", `--outputFile=${report}`], { cwd: ROOT, encoding: "utf8" });
  if (result.error !== undefined || !existsSync(report)) return null;
  return JSON.parse(readFileSync(report, "utf8")).testResults;
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

for (const mutation of MUTATIONS) {
  if (WANTED.length > 0 && !WANTED.includes(mutation.id)) continue;
  const outcome = outcomeOf(mutation);
  console.log(JSON.stringify(outcome));
}
console.log("finished");
