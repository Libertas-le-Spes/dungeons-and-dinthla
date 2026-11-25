import { FuzzySuggestModal, type App } from "obsidian";

export class FolderSuggestModal extends FuzzySuggestModal<string> {
  constructor(
    app: App,
    private readonly folders: string[],
    private readonly chosen: (folder: string) => void,
  ) {
    super(app);
    this.setPlaceholder("Find the folder your campaigns live in");
  }

  getItems(): string[] {
    return this.folders;
  }

  getItemText(folder: string): string {
    return folder;
  }

  onChooseItem(folder: string): void {
    this.chosen(folder);
  }
}
