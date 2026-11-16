import { OPEN_IN_EDITOR } from "../../note-page/left-campaign";
import { openShownInEditor, type ShownNote } from "../editor/editor-command";
import { editorLeavesOf, type EditorLeaves } from "../editor/editor-leaves";
import { CampaignView } from "./campaign-view";
import { ObsidianEditorStep, type EditorApp, type EditorGate } from "./open-in-editor";

export const OPEN_IN_EDITOR_COMMAND = "open-in-editor";

export interface EditorCommand {
  id: string;
  name: string;
  checkCallback(checking: boolean): boolean;
}

export class EditorWiring {
  private readonly leaves: EditorLeaves;
  readonly step: ObsidianEditorStep;

  constructor(private readonly app: EditorApp, gate: EditorGate) {
    this.leaves = editorLeavesOf(app);
    this.step = new ObsidianEditorStep(gate, this.leaves);
  }

  keptInEditor(leaf: object, path: string): boolean {
    return this.leaves.keeps(leaf, path);
  }

  command(): EditorCommand {
    return { id: OPEN_IN_EDITOR_COMMAND, name: OPEN_IN_EDITOR, checkCallback: this.checkCommand.bind(this) };
  }

  private checkCommand(checking: boolean): boolean {
    return openShownInEditor(this.step, this.shownNote(), checking);
  }

  private shownNote(): ShownNote | null {
    const view = this.app.workspace.getActiveViewOfType(CampaignView);
    if (view === null) return null;
    return { path: view.shownPath(), leaf: view.leaf };
  }
}
