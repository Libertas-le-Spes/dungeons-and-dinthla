import type { FencedFiles } from "../../../fence/gate/fenced-files";

export type NoteFiles = Pick<FencedFiles, "process" | "read" | "create" | "createFolder" | "getFolderByPath" | "getFiles">;
