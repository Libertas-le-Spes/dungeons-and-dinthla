import type { KeptKind } from "./kept-kind";

export class MovedKind implements KeptKind {
  readonly start = "moved:";
  readonly heading = "Kept from an earlier version";

  messageOf(session: string, keptAt: string): string {
    return `Lines typed but not saved in ${session} were kept in the plugin's settings file by an earlier version, and moved to this device on ${keptAt}.`;
  }
}
