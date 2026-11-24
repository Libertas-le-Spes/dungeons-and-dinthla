import { notHidden } from "../../campaign/changes/hidden-refusal";
import type { RecordChange } from "../../campaign/changes/record-change";
import { linesAddedTo, type SessionChange } from "../../campaign/changes/session-change";
import { verdictOf, type Verdict } from "../../campaign/changes/verdict";
import type { SessionNote } from "../../campaign/record/campaign";
import type { TrackedItem } from "./tracked-item";
import { refusalForTracking } from "./tracking-refusal";
import type { PropertiesSyntax } from "../../campaign/paths/session-file";

export interface TrackingSessions {
  readonly sessionNotes: SessionNote[];
}

class TrackingLine {
  constructor(
    private readonly store: TrackingSessions,
    private readonly sessionPath: string,
    private readonly syntax: PropertiesSyntax,
  ) {}

  sessionChangeOf(tracked: TrackedItem): SessionChange {
    return linesAddedTo(this.sessionPath, [tracked.line]);
  }

  sessions(): SessionNote[] {
    return this.store.sessionNotes;
  }

  readsAsTheItem(tracked: TrackedItem): Verdict {
    return verdictOf(refusalForTracking(this.store.sessionNotes, tracked, this.sessionPath, this.syntax));
  }
}

class PlannedItem {
  constructor(private readonly tracked: TrackedItem) {}

  plan(): TrackedItem {
    return this.tracked;
  }
}

export function trackingChange(store: TrackingSessions, tracked: TrackedItem, sessionPath: string, syntax: PropertiesSyntax): RecordChange<TrackedItem> {
  const line = new TrackingLine(store, sessionPath, syntax);
  const planned = new PlannedItem(tracked);
  const sessionChangeOf = line.sessionChangeOf.bind(line);
  return {
    plan: planned.plan.bind(planned),
    checks: [line.readsAsTheItem.bind(line), notHidden(line.sessions.bind(line), sessionChangeOf, syntax)],
    sessionChangeOf,
  };
}
