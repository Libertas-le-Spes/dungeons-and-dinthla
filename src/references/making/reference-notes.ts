import type { Campaign, SessionNote } from "../../campaign/record/campaign";
import type { FencedFileActions } from "../../fence/gate/fenced-file-actions";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import type { FencedMetadata } from "../../fence/gate/fenced-metadata";
import type { MakerFiles } from "../../note-keeping/new-note-maker";
import type { MakeResult } from "../../note-keeping/make-result";
import { SaidOnce } from "../../note-keeping/said-once";
import { messageOf } from "../../views/dialogs/message-of";
import { ReferenceNoteMaker } from "./reference-note-maker";
import { planReferenceNotes, type PlannedReferenceNote } from "./reference-note-plan";
import { noteNameOf } from "../../campaign/paths/note-name";
import { NewNameAnswers } from "../new-names/new-name-answers";
import { newNamesFor, type NewNames } from "../new-names/new-names";
import type { AskNewNames } from "../new-names/new-names-choice";
import type { ReferenceNotesPart } from "./reference-notes-part";

export interface ReferenceNotesStore {
  readonly current: Campaign;
  readonly campaignFolder: string | null;
  readonly opening: boolean;
  readonly sessionNotes: SessionNote[];
}

export interface ReferenceNotesNeeds {
  store: ReferenceNotesStore;
  files: Pick<FencedFiles, "markdownFilesUnder" | "getFileByPath"> & MakerFiles;
  metadata: Pick<FencedMetadata, "on" | "offref" | "unresolvedLinksOf" | "fileToLinktext" | "getFirstLinkpathDest">;
  actions: Pick<FencedFileActions, "processFrontMatter" | "trashFile">;
  say(message: string): void;
  askNewNames: AskNewNames;
}

export class ReferenceNotes implements ReferenceNotesPart {
  private readonly pending = new Set<string>();
  private asking = false;
  private readonly said: SaidOnce;
  private readonly maker: ReferenceNoteMaker;

  constructor(private readonly needs: ReferenceNotesNeeds) {
    this.said = new SaidOnce(needs.say);
    this.maker = new ReferenceNoteMaker({ ...needs, failed: (note, error) => this.failed(note, error) });
  }

  start(): () => void {
    const { metadata } = this.needs;
    const resolved = metadata.on("resolve", (file) => this.resolved(file.path));
    return () => metadata.offref(resolved);
  }

  sessionSaved(path: string): void {
    this.pending.add(path);
  }

  sessionGone(path: string): void {
    this.pending.delete(path);
  }

  private resolved(path: string): void {
    if (!this.pending.delete(path)) return;
    this.makeAll(path).catch((error: unknown) => this.said.say(`all:${messageOf(error)}`, `Couldn't make notes for new names: ${messageOf(error)}`));
  }

  private async makeAll(savedPath: string): Promise<void> {
    const { store, metadata } = this.needs;
    const campaignFolder = store.campaignFolder;
    if (campaignFolder === null || store.opening) return;
    const plan = planReferenceNotes({
      campaign: store.current,
      sessions: store.sessionNotes,
      campaignFolder,
      existingNames: this.existingNamesIn(campaignFolder),
      unresolvedLinksOf: (path) => metadata.unresolvedLinksOf(path),
    });
    for (const message of plan.refusals) this.said.say(message, message);
    for (const note of plan.notes) await this.maker.make(note);
    this.askAbout({ names: newNamesFor({ undecided: plan.undecided, savedPath, sessionName: noteNameOf(savedPath) }), campaignFolder });
  }

  private askAbout({ names, campaignFolder }: { names: NewNames | null; campaignFolder: string }): void {
    if (names === null || this.asking) return;
    const { store } = this.needs;
    const answers = new NewNameAnswers({
      maker: this.maker,
      askedIn: campaignFolder,
      campaignFolder: () => store.campaignFolder,
      existingNames: () => this.existingNamesIn(campaignFolder),
    });
    this.asking = true;
    this.needs.askNewNames(names, {
      chosen: (choice) => answers.make(choice).catch((error: unknown) => this.answerFailed(choice.undecided.name, error)),
      closed: () => {
        this.asking = false;
      },
    });
  }

  private existingNamesIn(campaignFolder: string): string[] {
    return this.needs.files.markdownFilesUnder(campaignFolder).map((file) => file.basename);
  }

  private answerFailed(name: string, error: unknown): MakeResult {
    this.said.say(`answer:${messageOf(error)}`, `Couldn't make the note for ${name}: ${messageOf(error)}`);
    return "failed";
  }

  private failed(note: PlannedReferenceNote, error: unknown): void {
    this.said.say(`${note.path}:${messageOf(error)}`, `Couldn't write the note for ${note.name}: ${messageOf(error)}`);
  }
}
