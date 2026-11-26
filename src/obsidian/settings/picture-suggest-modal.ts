import { FuzzySuggestModal, type App } from "obsidian";

export class PictureSuggestModal extends FuzzySuggestModal<string> {
  constructor(
    app: App,
    private readonly pictures: string[],
    private readonly chosen: (picture: string) => void,
  ) {
    super(app);
    this.setPlaceholder("Find a picture in your Campaigns folder");
  }

  getItems(): string[] {
    return this.pictures;
  }

  getItemText(picture: string): string {
    return picture;
  }

  onChooseItem(picture: string): void {
    this.chosen(picture);
  }
}
