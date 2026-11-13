export interface Command {
  program: string;
  args: string[];
}

export type RunStatus = (command: Command) => number | null;

export const SYSTEMD_RUN = "systemd-run";
export const PROBE: Command = { program: SYSTEMD_RUN, args: ["--user", "--scope", "-q", "-p", "MemoryMax=64M", "-p", "MemorySwapMax=0", "true"] };

export function canMakeABox(runStatus: RunStatus): boolean {
  return runStatus(PROBE) === 0;
}
