import { Modal, Notice, Setting, type App, type TextAreaComponent } from "obsidian";
import type { QuestRecord } from "../campaign/campaign";
import { PartlyWritten } from "../campaign/note-editor";
import { isSubmit } from "../views/keys";
import { messageOf } from "../views/message-of";
import { deleteOnSecondPress, type SecondPress } from "../views/second-press";
import { initialQuestEdit, type QuestEdit, type QuestStatusChoice } from "./quest-plan";

export interface QuestChoices {
  save(edit: QuestEdit): Promise<boolean>;
  delete(): Promise<boolean>;
}

export interface QuestPlaces {
  givenIn: string;
  finishedIn: string;
  writesTo: string;
}

const STATUS_WORDS: Record<QuestStatusChoice, string> = { active: "Active", completed: "Completed", failed: "Abandoned" };

function factsOf(record: QuestRecord): string {
  const facts: string[] = [];
  if (record.quest.givenBy !== undefined) facts.push(`From ${record.quest.givenBy}`);
  if (record.quest.reward !== undefined) facts.push(`Reward ${record.quest.reward}`);
  return facts.join(" · ");
}

export class QuestModal extends Modal {
  private readonly edit: QuestEdit;
  private secondPress: SecondPress | null = null;
  private changed = false;
  private busy = false;
  private rewardRow: HTMLElement | null = null;
  private happenedArea: TextAreaComponent | null = null;

  constructor(
    app: App,
    private readonly record: QuestRecord,
    private readonly places: QuestPlaces,
    private readonly canCollectReward: boolean,
    private readonly choices: QuestChoices,
    private readonly onClosed: (changed: boolean) => void,
  ) {
    super(app);
    this.edit = initialQuestEdit(record);
  }

  override onOpen(): void {
    const { contentEl } = this;
    this.setTitle("Quest");
    contentEl.addClass("dd-tokens", "dd-dialog");
    contentEl.createEl("p", { cls: "dd-subject", text: this.record.quest.title });
    const facts = factsOf(this.record);
    if (facts !== "") contentEl.createEl("p", { cls: "dd-detail", text: facts });
    contentEl.createEl("p", { cls: "dd-detail", text: `Given in ${this.places.givenIn}` });
    new Setting(contentEl).setName("Status").addDropdown((dropdown) => {
      for (const [value, word] of Object.entries(STATUS_WORDS)) dropdown.addOption(value, word);
      dropdown.setValue(this.edit.status).onChange((value) => {
        this.edit.status = value as QuestStatusChoice;
        if (this.edit.status === "active" && this.happenedArea !== null) {
          this.happenedArea.setValue("");
          this.edit.happened = "";
        }
        this.showRewardRow();
      });
      dropdown.selectEl.focus();
    });
    new Setting(contentEl).setName("What happened (optional)").addTextArea((area) => {
      area.setPlaceholder("Found it under the Old Mill; [[Mira]] took the lead").setValue(this.edit.happened).onChange((value) => {
        this.edit.happened = value;
      });
      this.happenedArea = area;
      area.inputEl.setAttr("aria-label", "What happened");
      area.inputEl.addEventListener("keydown", (event) => {
        if (!isSubmit(event, true)) return;
        event.preventDefault();
        this.run(() => this.choices.save(this.edit));
      });
    });
    if (this.canCollectReward) {
      const reward = new Setting(contentEl).setName(`Reward collected: add ${this.record.quest.reward} to the party funds`).addToggle((toggle) => {
        toggle.setValue(this.edit.collectReward).onChange((value) => {
          this.edit.collectReward = value;
        });
      });
      this.rewardRow = reward.settingEl;
      this.showRewardRow();
    }
    new Setting(contentEl).setName("Follow-up quest (optional)").addText((text) => {
      text.setPlaceholder("Return the caravan to [[Lady Vess]]").onChange((value) => {
        this.edit.followUp = value;
      });
      text.inputEl.setAttr("aria-label", "Follow-up quest");
      text.inputEl.addEventListener("keydown", (event) => {
        if (!isSubmit(event, false)) return;
        event.preventDefault();
        this.run(() => this.choices.save(this.edit));
      });
    });
    let where = `New lines go into ${this.places.writesTo}.`;
    if (this.record.outcome !== null) where = `New lines go into ${this.places.writesTo}; a changed outcome, with its reward and follow-up, goes into ${this.places.finishedIn}.`;
    contentEl.createEl("p", { cls: "dd-where", text: where });
    const buttons = new Setting(contentEl);
    buttons.addButton((button) => button.setButtonText("Save").setCta().onClick(() => this.run(() => this.choices.save(this.edit))));
    buttons.addButton((button) => button.setButtonText("Cancel").onClick(() => this.close()));
    buttons.addButton((button) => {
      this.secondPress = deleteOnSecondPress(button, "Delete quest", () => this.run(() => this.choices.delete()));
    });
  }

  override close(): void {
    if (this.busy) return;
    super.close();
  }

  override onClose(): void {
    if (this.secondPress !== null) this.secondPress.stop();
    this.contentEl.empty();
    this.onClosed(this.changed);
  }

  private showRewardRow(): void {
    if (this.rewardRow === null) return;
    this.rewardRow.toggle(this.edit.status === "completed");
  }

  private run(change: () => Promise<boolean>): void {
    if (this.busy) return;
    this.busy = true;
    change()
      .then((wrote) => {
        this.busy = false;
        this.changed = wrote;
        this.close();
      })
      .catch((error: unknown) => {
        this.busy = false;
        new Notice(`Couldn't change the quest: ${messageOf(error)}`);
        if (!(error instanceof PartlyWritten)) return;
        this.changed = true;
        this.close();
      });
  }
}
