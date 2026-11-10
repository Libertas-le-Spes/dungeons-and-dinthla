import type { FollowUpName } from "../kinds/follow-up-name";
import { kindFollowsUpWith } from "../kinds/follow-ups";
import type { MarkerName } from "../kinds/marker-name";
import type { TrackedKind } from "../kinds/tracked-kind";
import type { FollowUp } from "../notes/follow-up";
import type { Source, SourcedText, Thread } from "./campaign";
import { findSubject } from "./subject";

export abstract class ThreadBook<T extends Thread<SourcedText>> {
  readonly threads: T[] = [];

  constructor(
    private readonly kind: TrackedKind,
    private readonly unmatched: SourcedText[],
  ) {}

  addOpening(marker: MarkerName | null, body: string, source: Source): void {
    if (marker !== this.kind.marker.name) return;
    const thread = this.opened(body, source);
    if (thread !== null) this.threads.push(thread);
  }

  addFollowUp(followUp: FollowUp, line: string, source: Source): void {
    if (!kindFollowsUpWith(this.kind, followUp.kind)) return;
    const open = this.threads.filter((thread) => thread.closing === null);
    const found = findSubject(followUp.text, open, (thread) => thread.text);
    if (found === null) {
      this.unmatched.push({ text: line.trim(), source });
      return;
    }
    this.attach(found.candidate, followUp.kind, { text: found.rest, source });
  }

  protected abstract opened(body: string, source: Source): T | null;

  protected abstract attach(thread: T, name: FollowUpName, followUp: SourcedText): void;
}
