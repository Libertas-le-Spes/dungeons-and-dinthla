import type { KeptKind } from "./kept-kind";

export class DeletedKind implements KeptKind {
  readonly start = "deleted:";
  readonly heading = "Kept from deleted sessions";

  messageOf(session: string, keptAt: string): string {
    return `Lines typed but not saved in ${session} were kept when its note was deleted on ${keptAt}.`;
  }
}
