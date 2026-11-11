import type { KeptKind } from "./kept-kind";

export class MissingKind implements KeptKind {
  readonly start = "missing:";
  readonly heading = "Kept from missing sessions";

  messageOf(session: string, keptAt: string): string {
    return `Lines typed but not saved in ${session} were kept on ${keptAt}, when its note was no longer there.`;
  }
}
