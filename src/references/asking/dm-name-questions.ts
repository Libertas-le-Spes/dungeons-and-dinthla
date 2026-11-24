import type { SessionNote } from "../../campaign/record/campaign";
import { noteNameOf } from "../../campaign/paths/note-name";
import type { FencedFiles } from "../../fence/gate/fenced-files";
import type { MakeResult } from "../../note-keeping/make-result";
import { SaidOnce } from "../../note-keeping/said-once";
import { messageOf } from "../../views/dialogs/message-of";
import { ReferenceNoteMaker, type ReferenceNoteMakerNeeds } from "../making/reference-note-maker";
import type { ReferenceNotesPart } from "../making/reference-notes-part";
import { NewNameAnswers } from "../new-names/new-name-answers";
import { newNamesFor } from "../new-names/new-names";
import type { AskNewNames } from "../new-names/new-names-choice";
import { askedNamesIn } from "./asked-names";
import { takenNamesOf, type TakenNamesNeeds } from "./taken-names";
import type { FencedMetadata } from "../../fence/gate/fenced-metadata";

export interface DmNameQuestionsStore {
  readonly campaignFolder: string | null;
  readonly opening: boolean;
  readonly sessionNotes: SessionNote[];
}

export interface DmNameQuestionsNeeds extends Omit<ReferenceNoteMakerNeeds, "failed"> {
  store: DmNameQuestionsStore;
  files: TakenNamesNeeds["files"] & Pick<FencedFiles, "getFileByPath">;
  metadata: TakenNamesNeeds["metadata"] & Pick<FencedMetadata, "on" | "offref" | "getFirstLinkpathDest">;
  campaignFolders(): string[];
  say(message: string): void;
  askNewNames: AskNewNames;
}

export class DmNameQuestions implements ReferenceNotesPart {
  private readonly pending = new Set<string>();
  private asking = false;
  private readonly said: SaidOnce;
  private readonly maker: ReferenceNoteMaker;

  constructor(private readonly needs: DmNameQuestionsNeeds) {
    this.said = new SaidOnce(needs.say);
    this.maker = new ReferenceNoteMaker({
      ...needs,
      failed: (note, error) => this.said.say(`${note.path}:${messageOf(error)}`, `Couldn't write the note for ${note.name}: ${messageOf(error)}`),
    });
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
    this.askAll(path).catch((error: unknown) => this.said.say(`all:${messageOf(error)}`, `Couldn't ask about new names: ${messageOf(error)}`));
  }

  private async askAll(savedPath: string): Promise<void> {
    const { store } = this.needs;
    const campaignFolder = store.campaignFolder;
    if (campaignFolder === null || store.opening || this.asking) return;
    const asked = askedNamesIn({ sessions: store.sessionNotes, taken: this.takenIn(campaignFolder) });
    for (const message of asked.refusals) this.said.say(message, message);
    const unresolved = asked.names.filter(({ name }) => this.needs.metadata.getFirstLinkpathDest(name, savedPath) === null);
    const names = newNamesFor({ undecided: unresolved, savedPath, sessionName: noteNameOf(savedPath) });
    if (names === null) return;
    const answers = new NewNameAnswers({
      maker: this.maker,
      askedIn: campaignFolder,
      campaignFolder: () => store.campaignFolder,
      existingNames: () => this.takenIn(campaignFolder),
    });
    this.asking = true;
    this.needs.askNewNames(names, {
      chosen: (choice) => answers.make(choice).catch((error: unknown) => this.answerFailed(choice.undecided.name, error)),
      closed: () => {
        this.asking = false;
      },
    });
  }

  private takenIn(campaignFolder: string): string[] {
    return takenNamesOf({ needs: this.needs, campaignFolder });
  }

  private answerFailed(name: string, error: unknown): MakeResult {
    this.said.say(`answer:${messageOf(error)}`, `Couldn't make the note for ${name}: ${messageOf(error)}`);
    return "failed";
  }
}
