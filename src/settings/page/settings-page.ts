import { washOf, type Wash } from "../../campaign/background/wash";
import { campaignNameOf, mainNotePathOf, NO_CAMPAIGN } from "../../campaign/paths/campaign-folders";
import { NO_CAMPAIGNS_FOLDER } from "../../fence/paths/campaigns-folder-path";
import type { NoteChanges, Stop } from "../../host/notes/note-changes";
import type { NoteRef } from "../../host/notes/note-ref";
import type { Telling } from "../../host/showing/telling";
import { messageOf } from "../../views/dialogs/message-of";
import type { TextChange } from "../../views/elements/bindings/binding-wiring";
import { ChangeBinding, HandleRequest, PressBinding } from "../../views/elements/bindings/bindings";
import { KeptHandle } from "../../views/elements/bindings/kept-handle";
import { RunAction } from "../../views/elements/bindings/run-action";
import { Button, FieldRow, Paragraph, Select } from "../../views/elements/kinds/containers";
import { Option } from "../../views/elements/kinds/fields";
import type { ViewElement } from "../../views/elements/view-element";
import type { PageView, ShownPage } from "../../views/pages/page-view";
import type { CampaignsFolderSetup } from "../choosing/campaigns-folder-setup";
import type { CampaignChoice } from "../saved/campaign-choice";
import type { CampaignLooks, PickPicture } from "./campaign-looks";

const CAMPAIGNS_FOLDER_HINT = "Where your campaigns live.";
const FOLDER_HINT = "Background picture for its notes.";
const NO_PICTURE = "None yet.";
const WELCOME_HINT = "First steps for a new campaign.";
const WASH_CHOICES: readonly { wash: Wash; text: string }[] = [
  { wash: "subtle", text: "Subtle" },
  { wash: "balanced", text: "Balanced" },
  { wash: "strong", text: "Strong" },
];
const DROPDOWN_CLASS = ["dropdown"];

export interface SettingsNeeds {
  readonly campaignsFolder: Pick<CampaignsFolderSetup, "path" | "pick">;
  readonly campaigns: CampaignChoice;
  readonly looks: CampaignLooks;
  readonly pickPicture: PickPicture;
  readonly changes: Pick<NoteChanges, "onRead">;
  readonly telling: Pick<Telling, "say">;
  showWelcome(): Promise<void>;
}

class CampaignPicked implements TextChange {
  constructor(private readonly page: SettingsPage) {}

  changed(value: string): void {
    this.page.campaignPicked(value);
  }
}

class WashPicked implements TextChange {
  constructor(private readonly page: SettingsPage) {}

  changed(value: string): void {
    this.page.washPicked(washOf(value));
  }
}

function buttonOf(text: string, pressed: () => void, kept: KeptHandle | null): ViewElement {
  const bindings = [new PressBinding(new RunAction(pressed))];
  if (kept === null) return new Button({ text, bindings });
  return new Button({ text, bindings: [...bindings, new HandleRequest(kept)] });
}

export class SettingsPage implements ShownPage {
  readonly cls: readonly string[] = [];
  private readonly pictureText = new KeptHandle();
  private readonly chooseButton = new KeptHandle();
  private readonly removeButton = new KeptHandle();
  private readonly washSelect = new KeptHandle();
  private view: PageView | null = null;
  private folder: string | null = null;
  private stop: Stop | null = null;

  constructor(private readonly needs: SettingsNeeds) {}

  opened(view: PageView): void {
    this.view = view;
    this.stop = this.needs.changes.onRead(this.noteRead.bind(this));
    this.draw();
  }

  closed(): void {
    if (this.stop !== null) this.stop();
    this.stop = null;
    this.view = null;
    this.folder = null;
  }

  campaignPicked(folder: string): void {
    this.save(this.chooseCampaign(folder));
  }

  washPicked(wash: Wash): void {
    const folder = this.folder;
    if (folder === null) return;
    this.save(this.needs.looks.chooseWash(folder, wash));
  }

  private draw(): void {
    const view = this.view;
    if (view === null) return;
    this.folder = this.needs.campaigns.chosen();
    view.show([this.campaignsFolderRow(), ...this.campaignRows(), this.welcomeRow()]);
    this.showLook();
  }

  private campaignsFolderRow(): ViewElement {
    let now = NO_CAMPAIGNS_FOLDER;
    if (this.needs.campaignsFolder.path !== null) now = `Now: ${this.needs.campaignsFolder.path}`;
    return new FieldRow("Campaigns folder", `${CAMPAIGNS_FOLDER_HINT} ${now}`, [buttonOf("Choose folder", this.pickCampaignsFolder.bind(this), null)]);
  }

  private campaignRows(): ViewElement[] {
    const folder = this.folder;
    if (folder === null) return [new Paragraph({ text: NO_CAMPAIGN })];
    const campaigns: ViewElement[] = [];
    for (const each of this.needs.campaigns.folders()) campaigns.push(new Option({ text: campaignNameOf(each) }, each, each === folder));
    const washes: ViewElement[] = [];
    for (const choice of WASH_CHOICES) washes.push(new Option({ text: choice.text }, choice.wash));
    return [
      new FieldRow("Campaign", FOLDER_HINT, [new Select({ cls: DROPDOWN_CLASS, bindings: [new ChangeBinding(new CampaignPicked(this))] }, campaigns)]),
      new FieldRow("Background picture", null, [buttonOf("", this.pickPicture.bind(this), this.chooseButton), buttonOf("Remove picture", this.removePicture.bind(this), this.removeButton)], {}, { bindings: [new HandleRequest(this.pictureText)] }),
      new FieldRow("How much of the picture shows", null, [new Select({ cls: DROPDOWN_CLASS, bindings: [new ChangeBinding(new WashPicked(this)), new HandleRequest(this.washSelect)] }, washes)]),
    ];
  }

  private welcomeRow(): ViewElement {
    return new FieldRow("Welcome page", WELCOME_HINT, [buttonOf("Show this again", this.openWelcome.bind(this), null)]);
  }

  private showLook(): void {
    const folder = this.folder;
    if (folder === null) return;
    const look = this.needs.looks.lookOf(folder);
    let description = NO_PICTURE;
    let chooseText = "Choose a picture";
    if (look.picturePath !== null) {
      description = look.picturePath;
      chooseText = "Change picture";
    }
    this.pictureText.setText(description);
    this.chooseButton.setText(chooseText);
    this.removeButton.setDisabled(look.picturePath === null);
    this.washSelect.setValue(look.wash);
  }

  private noteRead(note: NoteRef): void {
    const folder = this.folder;
    if (folder === null || note.path !== mainNotePathOf(folder)) return;
    this.showLook();
  }

  private pickCampaignsFolder(): void {
    this.needs.campaignsFolder.pick(this.draw.bind(this));
  }

  private async chooseCampaign(folder: string): Promise<void> {
    await this.needs.campaigns.choose(folder);
    this.folder = folder;
    this.showLook();
  }

  private pickPicture(): void {
    this.needs.pickPicture(this.needs.looks.pictures(), this.picturePicked.bind(this));
  }

  private picturePicked(picturePath: string): void {
    const folder = this.folder;
    if (folder === null) return;
    this.save(this.needs.looks.choosePicture(folder, picturePath));
  }

  private removePicture(): void {
    const folder = this.folder;
    if (folder === null) return;
    this.save(this.needs.looks.removePicture(folder));
  }

  private openWelcome(): void {
    this.needs.showWelcome().catch(this.welcomeFailed.bind(this));
  }

  private welcomeFailed(error: unknown): void {
    this.needs.telling.say(`Couldn't open the welcome page: ${messageOf(error)}`);
  }

  private save(writing: Promise<void>): void {
    writing.catch(this.saveFailed.bind(this));
  }

  private saveFailed(error: unknown): void {
    this.needs.telling.say(`Couldn't save the campaign: ${messageOf(error)}`);
  }
}
