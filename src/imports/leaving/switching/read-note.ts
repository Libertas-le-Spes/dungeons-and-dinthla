import type { TFile } from "obsidian";
import { Refusal } from "../../../beyond/shape/refusal";
import type { LeavingFiles } from "./switch-plan";

export async function textOfNote(files: LeavingFiles, file: TFile, unreadWords: string): Promise<string> {
  try {
    return await files.read(file);
  } catch {
    throw new Refusal(unreadWords);
  }
}
