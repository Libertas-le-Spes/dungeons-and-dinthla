import { spawnSync } from "node:child_process";
import { canMakeABox, type Command } from "./memory-box.ts";
import { testRunFor } from "./test-command.ts";

const FIRST_GIVEN_ARGUMENT = 2;
const FAILED = 1;

function givenArguments(): string[] {
  const given: string[] = [];
  for (const [position, argument] of process.argv.entries()) {
    if (position >= FIRST_GIVEN_ARGUMENT) given.push(argument);
  }
  return given;
}

function quietStatus(command: Command): number | null {
  return spawnSync(command.program, command.args, { stdio: "ignore" }).status;
}

function exitCodeOf(status: number | null): number {
  if (status === null) return FAILED;
  return status;
}

const command = testRunFor(canMakeABox(quietStatus)).commandFor(givenArguments());
const result = spawnSync(command.program, command.args, { stdio: "inherit" });
process.exit(exitCodeOf(result.status));
