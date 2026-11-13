import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Backups } from "./backups.ts";
import { assertMemoryBox, boxedTestRun } from "./boxed-test-run.ts";
import type { Limits } from "./memory-box.ts";
import { choiceOf, givenArguments, isChosen, mutationsAt, occurrences, targetFiles, type Choice, type Mutation } from "./mutation-list.ts";
import { anchorSummaryOf, countOf, EXACTLY_ONCE, examplesOf, failuresIn, KILLED, runSummaryOf, statusOf, type Outcome } from "./outcomes.ts";
import { restoreOnSignal } from "./signal-restore.ts";
import type { SuiteResult } from "./suite-results.ts";

export interface RunnerArea {
  name: string;
  root: string;
  suites: string[];
  limits: Limits;
  mutations: URL;
}

const REFUSED = 2;
const NOT_ALL_KILLED = 1;

function filesDifferingFromHead(root: string, mutations: readonly Mutation[]): string[] {
  const differing: string[] = [];
  for (const file of targetFiles(mutations)) {
    const result = spawnSync("git", ["diff", "--quiet", "HEAD", "--", file], { cwd: root });
    if (result.status !== 0) differing.push(file);
  }
  return differing;
}

class MutationRun {
  private reportFolder: string | null = null;
  private readonly area: RunnerArea;
  private readonly backups: Backups;

  constructor(area: RunnerArea, backups: Backups) {
    this.area = area;
    this.backups = backups;
  }

  anchorOutcome(mutation: Mutation): Outcome {
    const text = readFileSync(join(this.area.root, mutation.file), "utf8");
    return { id: mutation.id, group: mutation.group, status: `ANCHOR ${occurrences(text, mutation.find)}`, failed: 0, loadFailures: 0, examples: [] };
  }

  outcomeOf(mutation: Mutation): Outcome {
    const outcome = this.anchorOutcome(mutation);
    if (outcome.status !== EXACTLY_ONCE) return outcome;
    const path = join(this.area.root, mutation.file);
    const original = readFileSync(path, "utf8");
    this.backups.keep(mutation.file, original);
    writeFileSync(path, original.split(mutation.find).join(mutation.replace));
    let suites: SuiteResult[] | null;
    try {
      suites = boxedTestRun({ root: this.area.root, suites: this.area.suites, report: join(this.folder(), "report.json"), limits: this.area.limits });
    } finally {
      writeFileSync(path, original);
      this.backups.drop(mutation.file);
    }
    if (suites === null) return { ...outcome, status: "NO REPORT" };
    const failures = failuresIn(suites);
    return { ...outcome, status: statusOf(failures), failed: failures.assertions.length, loadFailures: failures.loads.length, examples: examplesOf(failures) };
  }

  clearReports(): void {
    if (this.reportFolder !== null) rmSync(this.reportFolder, { recursive: true, force: true });
  }

  private folder(): string {
    if (this.reportFolder === null) this.reportFolder = mkdtempSync(join(tmpdir(), `${this.area.name}-mutations-`));
    return this.reportFolder;
  }
}

function refuse(reason: object): never {
  console.log(JSON.stringify(reason));
  process.exit(REFUSED);
}

function checkBeforeRunning(area: RunnerArea, mutations: readonly Mutation[], choice: Choice): void {
  if (choice.unknown.length > 0) refuse({ refused: "No mutation has these ids, so nothing was run. Copy an id from mutations.json.", unknown: choice.unknown });
  if (choice.anchorsOnly) return;
  assertMemoryBox();
  const differing = filesDifferingFromHead(area.root, mutations);
  if (differing.length > 0 && !choice.allowDirty) refuse({ refused: "These files differ from HEAD, so a mutation could not be told from your edit. Commit them, or pass --allow-dirty.", files: differing });
}

function anchorsOnly(run: MutationRun, mutations: readonly Mutation[], choice: Choice): void {
  const outcomes: Outcome[] = [];
  for (const mutation of mutations) {
    if (isChosen(choice, mutation)) outcomes.push(run.anchorOutcome(mutation));
  }
  for (const outcome of outcomes) console.log(JSON.stringify(outcome));
  console.log(anchorSummaryOf(outcomes));
  console.log("finished");
  if (countOf(outcomes, EXACTLY_ONCE) !== outcomes.length) process.exit(NOT_ALL_KILLED);
}

function mutated(run: MutationRun, mutations: readonly Mutation[], choice: Choice): void {
  const outcomes: Outcome[] = [];
  try {
    for (const mutation of mutations) {
      if (!isChosen(choice, mutation)) continue;
      const outcome = run.outcomeOf(mutation);
      outcomes.push(outcome);
      console.log(JSON.stringify(outcome));
    }
  } finally {
    run.clearReports();
  }
  console.log(runSummaryOf(outcomes));
  console.log("finished");
  if (countOf(outcomes, KILLED) !== outcomes.length) process.exit(NOT_ALL_KILLED);
}

export function runMutations(area: RunnerArea): void {
  const mutations = mutationsAt(area.mutations);
  const choice = choiceOf(givenArguments(process.argv), mutations);
  const backups = new Backups(area.root, area.name);
  for (const file of backups.restoreAll()) console.log(JSON.stringify({ restored: file }));
  checkBeforeRunning(area, mutations, choice);
  const run = new MutationRun(area, backups);
  if (choice.anchorsOnly) {
    anchorsOnly(run, mutations, choice);
    return;
  }
  restoreOnSignal(backups, process);
  mutated(run, mutations, choice);
}
