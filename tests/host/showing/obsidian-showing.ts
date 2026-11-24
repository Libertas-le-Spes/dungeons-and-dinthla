import type { App } from "obsidian";
import { OBSIDIAN_TELLING } from "../../../src/obsidian/views/frames/obsidian-telling";
import { obsidianDialogsOf } from "../../../src/obsidian/views/frames/modal-frame";
import type { DialogShowing } from "../../../src/views/dialogs/dialog-view";

export const OBSIDIAN_SHOWING: DialogShowing = { dialogs: obsidianDialogsOf({} as App), telling: OBSIDIAN_TELLING };
