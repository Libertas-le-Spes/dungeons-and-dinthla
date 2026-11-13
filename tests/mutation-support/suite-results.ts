import { existsSync, readFileSync, rmSync } from "node:fs";

export interface TestResult {
  status: string;
  fullName: string;
}

export interface SuiteResult {
  name: string;
  status: string;
  assertionResults: TestResult[];
}

export function clearReport(path: string): void {
  rmSync(path, { force: true });
}

export function readReport(path: string): SuiteResult[] | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf8")).testResults;
  } catch {
    return null;
  }
}
