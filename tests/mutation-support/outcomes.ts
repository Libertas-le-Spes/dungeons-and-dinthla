import type { SuiteResult } from "./suite-results.ts";

export interface Outcome {
  id: string;
  group: string;
  status: string;
  failed: number;
  loadFailures: number;
  examples: string[];
}

export interface Failures {
  assertions: string[];
  loads: string[];
}

export const KILLED = "killed";
export const EXACTLY_ONCE = "ANCHOR 1";
const LOAD_FAILURE = "SUITE FAILED TO LOAD";
const EXAMPLES = 3;

export function statusOf(failures: Failures): string {
  if (failures.assertions.length > 0) return KILLED;
  if (failures.loads.length > 0) return "LOAD-ONLY";
  return "SURVIVED";
}

export function failuresIn(suites: readonly SuiteResult[]): Failures {
  const failures: Failures = { assertions: [], loads: [] };
  for (const suite of suites) {
    for (const test of suite.assertionResults) {
      if (test.status === "failed") failures.assertions.push(test.fullName);
    }
    if (suite.status === "failed" && suite.assertionResults.length === 0) failures.loads.push(`${LOAD_FAILURE}: ${suite.name}`);
  }
  return failures;
}

export function examplesOf(failures: Failures): string[] {
  const first: string[] = [];
  for (const name of [...failures.assertions, ...failures.loads]) {
    if (first.length < EXAMPLES) first.push(name);
  }
  return first;
}

export function countOf(outcomes: readonly Outcome[], status: string): number {
  let count = 0;
  for (const outcome of outcomes) {
    if (outcome.status === status) count += 1;
  }
  return count;
}

export function runSummaryOf(outcomes: readonly Outcome[]): string {
  const killed = countOf(outcomes, KILLED);
  return JSON.stringify({ total: outcomes.length, killed, notKilled: outcomes.length - killed, loadOnly: countOf(outcomes, "LOAD-ONLY"), survived: countOf(outcomes, "SURVIVED") });
}

export function anchorSummaryOf(outcomes: readonly Outcome[]): string {
  const once = countOf(outcomes, EXACTLY_ONCE);
  return JSON.stringify({ total: outcomes.length, anchoredOnce: once, notAnchoredOnce: outcomes.length - once });
}
