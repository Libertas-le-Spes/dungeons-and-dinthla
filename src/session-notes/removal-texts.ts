import type { ConfirmText } from "../views/confirm-modal";

const OTHERS_STAY = "Other sessions, and values learned on character sheets, stay.";
const DELETED_PERMANENTLY = "Obsidian is set to delete files permanently, so the note can't be taken back from a trash.";

function notesGoWithIt(count: number): string {
  if (count === 0) return "It has no notes.";
  if (count === 1) return "Its 1 note goes with it, including any question, quest or ledger line first written in it.";
  return `Its ${count} notes go with it, including any questions, quests and ledger lines first written in it.`;
}

function notesGo(count: number): string {
  if (count === 1) return "Its 1 note goes, with any question, quest or ledger line first written in it.";
  return `Its ${count} notes go, including any questions, quests and ledger lines first written in them.`;
}

function deleteBodyOf(count: number, permanently: boolean): string {
  const body = `${notesGoWithIt(count)} ${OTHERS_STAY}`;
  if (!permanently) return body;
  return `${body} ${DELETED_PERMANENTLY}`;
}

export function deleteTextOf(heading: string, count: number, permanently: boolean): ConfirmText {
  return {
    title: `Delete ${heading}?`,
    body: deleteBodyOf(count, permanently),
    confirm: "Delete session",
    keep: "Keep session",
  };
}

export function clearTextOf(heading: string, count: number): ConfirmText {
  return {
    title: `Clear the notes of ${heading}?`,
    body: `${notesGo(count)} The session and its properties stay.`,
    confirm: "Clear notes",
    keep: "Keep notes",
  };
}
