import { SYSTEMD_RUN, type Command } from "./memory-box.ts";

export const TEST_MEMORY_MAX = "3G";
const NPX = "npx";
const VITEST_RUN = ["vitest", "run"];
const ONE_WORKER = "--maxWorkers=1";
const TEST_BOX = ["--user", "--scope", "-q", "-p", `MemoryMax=${TEST_MEMORY_MAX}`, "-p", "MemorySwapMax=0", "nice", "-n", "19"];

export interface TestRun {
  commandFor(given: string[]): Command;
}

export class BoxedTestRun implements TestRun {
  commandFor(given: string[]): Command {
    return { program: SYSTEMD_RUN, args: [...TEST_BOX, NPX, ...VITEST_RUN, ...given] };
  }
}

export class PlainTestRun implements TestRun {
  commandFor(given: string[]): Command {
    return { program: NPX, args: [...VITEST_RUN, ONE_WORKER, ...given] };
  }
}

export function testRunFor(boxable: boolean): TestRun {
  if (boxable) return new BoxedTestRun();
  return new PlainTestRun();
}
