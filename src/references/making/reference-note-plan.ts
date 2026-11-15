import type { Campaign, SessionNote } from "../../campaign/record/campaign";
import { NOTE_ENDING } from "../../campaign/paths/note-name";
import { referenceFolderOf } from "../../campaign/paths/campaign-folders";
import { REFERENCE_KINDS } from "../../kinds/reference-kinds";
import type { ReferenceKindName } from "../../kinds/reference-kind";
import { refusalForFileName } from "../../names/file-name";
import { nameKeyOf } from "../../names/name-key";
import { namedOnLines, type NamedWithKind } from "../named-on-lines";
import { oftenNamed } from "../often-named";

export interface PlannedReferenceNote {
  name: string;
  kind: ReferenceKindName;
  path: string;
  firstSession: SessionNote;
}

export interface ReferenceNotePlan {
  notes: PlannedReferenceNote[];
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

class ReferenceNotePlanner {
  readonly plan: ReferenceNotePlan = { notes: [], refusals: [] };
  private readonly existing: Set<string>;
  private readonly owners = new Map<string, string>();
  private readonly sessionNames: SessionNames[];
  private readonly unresolved = new Map<string, Set<string>>();

  constructor(private readonly input: ReferenceNotePlanInput) {
    this.existing = new Set(input.existingNames.map(nameKeyOf));
    const ordered = [...input.sessions].sort((one, other) => one.number - other.number);
    this.sessionNames = ordered.map((session) => ({ session, names: this.namesIn(session) }));
  }

  considerAll(known: NamedWithKind[]): void {
    const considered = new Set<string>();
    for (const { session, names } of this.sessionNames) {
      for (const named of known) {
        if (!names.has(named.name) || considered.has(named.name)) continue;
        considered.add(named.name);
        this.consider({ named, first: session });
      }
    }
  }

  private consider({ named, first }: { named: NamedWithKind; first: SessionNote }): void {
    const { kind, name } = named;
    const naming = this.sessionNames.filter((sessionNames) => sessionNames.names.has(name));
    if (!naming.every(({ session }) => this.isUnresolvedIn(session, name))) return;
    const key = nameKeyOf(name);
    if (this.existing.has(key)) return;
    const reason = this.refusalFor(name);
    if (reason !== null) {
      this.plan.refusals.push(noReferenceNoteMessage(name, reason));
      return;
    }
    const owner = this.owners.get(key);
    if (owner !== undefined) {
      this.plan.refusals.push(sharedReferenceNameMessage(name, owner));
      return;
    }
    this.owners.set(key, name);
    const folder = referenceFolderOf(REFERENCE_KINDS[kind], this.input.campaignFolder);
    this.plan.notes.push({ name, kind, path: `${folder}/${name}.md`, firstSession: first });
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
  const { known } = oftenNamed(namedOnLines(input.campaign, input.sessions));
  planner.considerAll(known);
  return planner.plan;
}
