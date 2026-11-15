import type { Campaign, SessionNote } from "../../campaign/record/campaign";
import { NOTE_ENDING } from "../../campaign/paths/note-name";
import { referenceFolderOf } from "../../campaign/paths/campaign-folders";
import { REFERENCE_KINDS } from "../../kinds/reference-kinds";
import type { ReferenceKindName } from "../../kinds/reference-kind";
import { refusalForFileName } from "../../names/file-name";
import { nameKeyOf } from "../../names/name-key";
import { namedOnLines } from "../named-on-lines";
import { oftenNamed, type OftenNamed } from "../often-named";

export interface PlannedReferenceNote {
  name: string;
  kind: ReferenceKindName;
  path: string;
  firstSession: SessionNote;
}

export interface UndecidedName {
  name: string;
  firstSession: SessionNote;
  namedIn: string[];
}

export interface ReferenceNotePlan {
  notes: PlannedReferenceNote[];
  undecided: UndecidedName[];
  refusals: string[];
}

export interface ReferenceNotePlanInput {
  campaign: Campaign;
  sessions: SessionNote[];
  campaignFolder: string;
  existingNames: string[];
  unresolvedLinksOf(path: string): string[];
}

export function noReferenceNoteMessage(name: string, reason: string): string {
  return `No note was made for ${name}: ${reason}`;
}

export function sharedReferenceNameMessage(name: string, owner: string): string {
  return noReferenceNoteMessage(name, `its note would have the same name as the note of ${owner}.`);
}

export const ENDS_LIKE_A_NOTE = `a name can't end in ${NOTE_ENDING}, since its note would then be named twice over.`;

interface SessionNames {
  session: SessionNote;
  names: Set<string>;
}

export interface PlannedNoteInput {
  name: string;
  kind: ReferenceKindName;
  campaignFolder: string;
  firstSession: SessionNote;
}

export function plannedReferenceNote({ name, kind, campaignFolder, firstSession }: PlannedNoteInput): PlannedReferenceNote {
  const folder = referenceFolderOf(REFERENCE_KINDS[kind], campaignFolder);
  return { name, kind, path: `${folder}/${name}.md`, firstSession };
}

class ReferenceNotePlanner {
  readonly plan: ReferenceNotePlan = { notes: [], undecided: [], refusals: [] };
  private readonly existing: Set<string>;
  private readonly owners = new Map<string, string>();
  private readonly sessionNames: SessionNames[];
  private readonly unresolved = new Map<string, Set<string>>();

  constructor(private readonly input: ReferenceNotePlanInput) {
    this.existing = new Set(input.existingNames.map(nameKeyOf));
    const ordered = [...input.sessions].sort((one, other) => one.number - other.number);
    this.sessionNames = ordered.map((session) => ({ session, names: this.namesIn(session) }));
  }

  considerAll({ known, undecided }: OftenNamed): void {
    for (const { named, first } of this.firstSessionsOf(known)) {
      if (!this.isMakeable(named.name)) continue;
      this.plan.notes.push(plannedReferenceNote({ name: named.name, kind: named.kind, campaignFolder: this.input.campaignFolder, firstSession: first }));
    }
    for (const { named, first } of this.firstSessionsOf(undecided)) {
      if (!this.isMakeable(named.name)) continue;
      this.plan.undecided.push({ name: named.name, firstSession: first, namedIn: this.sessionsNaming(named.name).map(({ path }) => path) });
    }
  }

  private firstSessionsOf<Named extends { name: string }>(all: Named[]): { named: Named; first: SessionNote }[] {
    const found: { named: Named; first: SessionNote }[] = [];
    const considered = new Set<string>();
    for (const { session, names } of this.sessionNames) {
      for (const named of all) {
        if (!names.has(named.name) || considered.has(named.name)) continue;
        considered.add(named.name);
        found.push({ named, first: session });
      }
    }
    return found;
  }

  private sessionsNaming(name: string): SessionNote[] {
    return this.sessionNames.filter(({ names }) => names.has(name)).map(({ session }) => session);
  }

  private isMakeable(name: string): boolean {
    if (!this.sessionsNaming(name).every((session) => this.isUnresolvedIn(session, name))) return false;
    const key = nameKeyOf(name);
    if (this.existing.has(key)) return false;
    const reason = this.refusalFor(name);
    if (reason !== null) {
      this.plan.refusals.push(noReferenceNoteMessage(name, reason));
      return false;
    }
    const owner = this.owners.get(key);
    if (owner !== undefined) {
      this.plan.refusals.push(sharedReferenceNameMessage(name, owner));
      return false;
    }
    this.owners.set(key, name);
    return true;
  }

  private refusalFor(name: string): string | null {
    if (name.toLowerCase().endsWith(NOTE_ENDING)) return ENDS_LIKE_A_NOTE;
    return refusalForFileName(name);
  }

  private namesIn(session: SessionNote): Set<string> {
    return new Set(namedOnLines(this.input.campaign, [session]).map(({ name }) => name));
  }

  private isUnresolvedIn(session: SessionNote, name: string): boolean {
    const known = this.unresolved.get(session.path);
    if (known !== undefined) return known.has(name);
    const made = new Set(this.input.unresolvedLinksOf(session.path));
    this.unresolved.set(session.path, made);
    return made.has(name);
  }
}

export function planReferenceNotes(input: ReferenceNotePlanInput): ReferenceNotePlan {
  const planner = new ReferenceNotePlanner(input);
  planner.considerAll(oftenNamed(namedOnLines(input.campaign, input.sessions)));
  return planner.plan;
}
