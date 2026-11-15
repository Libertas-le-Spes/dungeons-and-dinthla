import { beforeEach, describe, expect, it } from "vitest";
import type { App } from "obsidian";
import { NewCampaignModal, type NewCampaignAnswers } from "../../../src/campaign/writing/new-campaign-modal";
import { Notice } from "../../stubs/obsidian";

class Answers implements NewCampaignAnswers {
  readonly typed: string[] = [];
  opened = 0;

  constructor(private readonly outcome: boolean | Error) {}

  async make(name: string): Promise<boolean> {
    this.typed.push(name);
    if (this.outcome instanceof Error) throw this.outcome;
    return this.outcome;
  }

  made(): void {
    this.opened += 1;
  }
}

function opened(answers: NewCampaignAnswers): NewCampaignModal {
  const modal = new NewCampaignModal({} as App, answers);
  modal.open();
  return modal;
}

function typeIn(modal: NewCampaignModal, typed: string): void {
  const input = modal.contentEl.querySelector("input")!;
  input.value = typed;
  input.dispatchEvent(new (input.ownerDocument.defaultView!.Event)("input"));
}

function submit(modal: NewCampaignModal, typed: string): void {
  typeIn(modal, typed);
  makeButton(modal).click();
}

function makeButton(modal: NewCampaignModal): HTMLButtonElement {
  return Array.from(modal.contentEl.querySelectorAll("button")).find((button) => button.textContent === "Make campaign")!;
}

const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("NewCampaignModal", () => {
  beforeEach(() => {
    Notice.shown = [];
  });

  it("asks for a name, and hands what was typed over to be made", async () => {
    const answers = new Answers(true);
    const modal = opened(answers);
    expect((modal as unknown as { title: string }).title).toBe("New campaign");
    expect(makeButton(modal).textContent).toBe("Make campaign");
    submit(modal, "Silver Road");
    await settled();
    expect(answers.typed).toEqual(["Silver Road"]);
  });

  it("closes and opens the campaign once it is made", async () => {
    const answers = new Answers(true);
    const modal = opened(answers);
    submit(modal, "Silver Road");
    await settled();
    expect(answers.opened).toBe(1);
    expect(modal.contentEl.querySelector("input")).toBeNull();
  });

  it("stays open, with the name still typed, when the campaign wasn't made", async () => {
    const answers = new Answers(false);
    const modal = opened(answers);
    submit(modal, "Silver Road");
    await settled();
    expect(answers.opened).toBe(0);
    expect(modal.contentEl.querySelector("input")!.value).toBe("Silver Road");
    expect(makeButton(modal).disabled).toBe(false);
  });

  it("says why when making the campaign fails outright, and stays open", async () => {
    const answers = new Answers(new Error("The disk is full."));
    const modal = opened(answers);
    submit(modal, "Silver Road");
    await settled();
    expect(Notice.shown).toEqual(["Couldn't make the campaign: The disk is full."]);
    expect(answers.opened).toBe(0);
    expect(makeButton(modal).disabled).toBe(false);
  });

  it("makes the campaign when Enter is pressed in the name box", async () => {
    const answers = new Answers(true);
    const modal = opened(answers);
    typeIn(modal, "Silver Road");
    const input = modal.contentEl.querySelector("input")!;
    input.dispatchEvent(new (input.ownerDocument.defaultView!.KeyboardEvent)("keydown", { key: "Enter", cancelable: true }));
    await settled();
    expect(answers.typed).toEqual(["Silver Road"]);
    expect(answers.opened).toBe(1);
  });

  it("makes nothing when another key is pressed in the name box", async () => {
    const answers = new Answers(true);
    const modal = opened(answers);
    const input = modal.contentEl.querySelector("input")!;
    input.dispatchEvent(new (input.ownerDocument.defaultView!.KeyboardEvent)("keydown", { key: "a", cancelable: true }));
    await settled();
    expect(answers.typed).toEqual([]);
  });

  it("closes without making anything on Cancel", async () => {
    const answers = new Answers(true);
    const modal = opened(answers);
    Array.from(modal.contentEl.querySelectorAll("button")).find((button) => button.textContent === "Cancel")!.click();
    await settled();
    expect(answers.typed).toEqual([]);
    expect(modal.contentEl.querySelector("input")).toBeNull();
  });
});
