import type { BeyondCall } from "./online/beyond-call";
import type { Clock } from "./keeping/clock";
import type { DeviceStorage } from "./keeping/device-storage";
import type { Pauses } from "./keeping/pauses";
import type { PluginData } from "./keeping/plugin-data";
import type { LinkLookup } from "./notes/link-lookup";
import type { NoteChanges } from "./notes/note-changes";
import type { NoteFacts } from "./notes/note-facts";
import type { NoteKeeping } from "./notes/note-keeping";
import type { NoteStore } from "./notes/note-store";
import type { HostRules } from "./rules/host-rules";
import type { NoteSyntax } from "./rules/note-syntax";
import type { Telling } from "./showing/telling";

export interface HostNotes {
  readonly store: NoteStore;
  readonly keeping: NoteKeeping;
  readonly changes: NoteChanges;
  readonly facts: NoteFacts;
  readonly links: LinkLookup;
}

export interface Host {
  readonly notes: HostNotes;
  readonly rules: HostRules;
  readonly syntax: NoteSyntax;
  readonly data: PluginData;
  readonly device: DeviceStorage;
  readonly clock: Clock;
  readonly pauses: Pauses;
  readonly telling: Telling;
  readonly beyond: BeyondCall;
}
