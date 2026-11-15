import { messageOf } from "../../views/dialogs/message-of";
import { kindNoteTitleOf } from "../wanting/kind-note-path";
import type { WantedNote } from "../wanting/wanted-note";

export function notLinkedMessage(wanted: WantedNote): string {
  return `${wanted.path} isn't linked to its session, so it was left alone.`;
}

export function staysMessage(wanted: WantedNote): string {
  return `${wanted.path} holds your words, so it stays, though its session is gone. A session that takes the number of ${wanted.sessionPath} will adopt it: Fix rewrites only its lines.`;
}

export function failedMessage(wanted: WantedNote, error: unknown): string {
  return `Couldn't write ${kindNoteTitleOf(wanted.folder, wanted.sessionPath)}: ${messageOf(error)}`;
}
