import { FuzzySuggestModal, type App, type TFile } from "obsidian";

export class PictureSuggestModal extends FuzzySuggestModal<TFile> {
  constructor(
    app: App,
    private readonly pictures: TFile[],
    private readonly chosen: (picture: TFile) => void,
  ) {
    super(app);
    this.setPlaceholder("Find a picture in your Campaigns folder");
  }

  getItems(): TFile[] {
    return this.pictures;
  }

  getItemText(picture: TFile): string {
    return picture.path;
  }

  onChooseItem(picture: TFile): void {
    this.chosen(picture);
  }
}
