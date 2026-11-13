import { fallenFolderOf, fallenRecordPathOf } from "../../../campaign/paths/campaign-folders";
import { fallenRecordOf } from "../../../campaign/paths/fallen-records";
import type { NoteFiles } from "../../note/writing/note-files";
import { recordExists, recordNotAsWritten } from "./record-refusals";

export class RecordWriter {
  constructor(private readonly files: NoteFiles) {}

  async put(campaignFolder: string, name: string, text: string): Promise<void> {
    const existing = fallenRecordOf(this.files.getFiles(), campaignFolder, name);
    if (existing !== null) throw recordExists(existing.basename);
    const folder = fallenFolderOf(campaignFolder);
    if (this.files.getFolderByPath(folder) === null) await this.files.createFolder(folder);
    const file = await this.files.create(fallenRecordPathOf(campaignFolder, name), text);
    const written = await this.files.read(file);
    if (written !== text) throw recordNotAsWritten(name);
  }
}
