import { debounce, Plugin, type Editor, type TFile } from "obsidian";
import type { Source } from "./campaign/campaign";
import { campaignFolderOf, findCampaignFolders } from "./campaign/campaign-folders";
import { CampaignStore } from "./campaign/campaign-store";
import { QUESTIONS_VIEW, QuestionsView } from "./questions/questions-view";

export default class DungeonsAndDinthla extends Plugin {
  private store!: CampaignStore;

  override async onload(): Promise<void> {
    this.store = new CampaignStore(this.app.vault, this.app.metadataCache);
    const actions = {
      openSource: (source: Source) => void this.openSource(source),
      openLink: (target: string, sourcePath: string) => void this.app.workspace.openLinkText(target, sourcePath),
    };
    this.registerView(QUESTIONS_VIEW, (leaf) => new QuestionsView(leaf, this.store, actions));
    this.addRibbonIcon("circle-help", "Open questions", () => void this.openQuestions());
    this.addCommand({ id: "open-questions", name: "Open questions", callback: () => void this.openQuestions() });
    this.app.workspace.onLayoutReady(() => void this.watchCampaign());
  }

  private async watchCampaign(): Promise<void> {
    const activeFile = this.app.workspace.getActiveFile();
    const folders = this.campaignFolders();
    let folder = folders[0];
    if (activeFile !== null) folder = campaignFolderOf(activeFile.path, folders) ?? folder;
    if (folder !== undefined) await this.store.open(folder);
    const editorChanged = debounce((editor: Editor, file: TFile) => this.readEditor(editor, file), 250, true);
    this.registerEvent(this.app.workspace.on("editor-change", (editor, info) => {
      if (info.file !== null) editorChanged(editor, info.file);
    }));
    this.registerEvent(this.app.metadataCache.on("changed", (file, text, cache) => this.store.noteChanged(file, text, cache)));
    this.registerEvent(this.app.vault.on("delete", (file) => this.store.noteDeleted(file.path)));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => void this.store.noteRenamed(file.path, oldPath)));
    this.registerEvent(this.app.workspace.on("file-open", (file) => void this.followCampaignOf(file)));
  }

  private readEditor(editor: Editor, file: TFile): void {
    this.store.noteChanged(file, editor.getValue(), this.app.metadataCache.getFileCache(file));
  }

  private campaignFolders(): string[] {
    return findCampaignFolders(this.app.vault.getFiles().map((file) => file.path));
  }

  private async followCampaignOf(file: TFile | null): Promise<void> {
    if (file === null) return;
    const folder = campaignFolderOf(file.path, this.campaignFolders());
    if (folder === null || folder === this.store.campaignFolder) return;
    await this.store.open(folder);
  }

  private async openSource(source: Source): Promise<void> {
    const file = this.app.vault.getFileByPath(source.path);
    if (file === null) return;
    await this.app.workspace.getLeaf(false).openFile(file, { eState: { line: source.line } });
  }

  private async openQuestions(): Promise<void> {
    const [open] = this.app.workspace.getLeavesOfType(QUESTIONS_VIEW);
    if (open !== undefined) {
      await this.app.workspace.revealLeaf(open);
      return;
    }
    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf === null) return;
    await leaf.setViewState({ type: QUESTIONS_VIEW, active: true });
    await this.app.workspace.revealLeaf(leaf);
  }
}
