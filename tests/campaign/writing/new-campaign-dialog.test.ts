import { beforeEach, describe, expect, it } from "vitest";
import type { App } from "obsidian";
import { NewCampaignDialog, type NewCampaignAnswers } from "../../../src/campaign/writing/new-campaign-dialog";
import { OBSIDIAN_TELLING } from "../../../src/obsidian/views/frames/obsidian-telling";
import { ModalFrame } from "../../../src/obsidian/views/frames/modal-frame";
import { MountedView } from "../../host/showing/mounted-view";
import { Notice } from "../../stubs/obsidian";

class Answers implements NewCampaignAnswers {
  readonly typed: string[] = [];
  opened = 0;
  private finish: (made: boolean) => void = () => {};

  constructor(private readonly outcome: boolean | Error | "held") {}

  async make(name: string): Promise<boolean> {
    this.typed.push(name);
    if (this.outcome instanceof Error) throw this.outcome;
    if (this.outcome === "held") return new Promise((resolve) => (this.finish = resolve));
    return this.outcome;
  }

  release(): void {
    this.finish(true);
  }

  made(): void {
    this.opened += 1;
  }
}

function opened(answers: NewCampaignAnswers): ModalFrame {
  const modal = new ModalFrame({} as App, new NewCampaignDialog(OBSIDIAN_TELLING, answers));
  modal.open();
  return modal;
}

function elementIn<Found extends Element>(modal: ModalFrame, selector: string): Found {
  const found = modal.contentEl.querySelector<Found>(selector);
  if (found === null) throw new Error(`The window has no ${selector}.`);
  return found;
}

function inputOf(modal: ModalFrame): HTMLInputElement {
  return elementIn<HTMLInputElement>(modal, "input");
}

function buttonSaying(modal: ModalFrame, words: string): HTMLButtonElement {
  const found = Array.from(modal.contentEl.querySelectorAll("button")).find((button) => button.textContent === words);
  if (found === undefined) throw new Error(`The window has no ${words} button.`);
  return found;
}

function windowOf(element: Element): Window & typeof globalThis {
  const window = element.ownerDocument.defaultView;
  if (window === null) throw new Error("The page has no window.");
  return window;
}

function typeIn(modal: ModalFrame, typed: string): void {
  const input = inputOf(modal);
  input.value = typed;
  input.dispatchEvent(new (windowOf(input).Event)("input"));
}

function press(modal: ModalFrame, key: string): void {
  const input = inputOf(modal);
  input.dispatchEvent(new (windowOf(input).KeyboardEvent)("keydown", { key, cancelable: true }));
}

function submit(modal: ModalFrame, typed: string): void {
  typeIn(modal, typed);
  buttonSaying(modal, "Make campaign").click();
}

const settled = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("NewCampaignDialog", () => {
  beforeEach(() => {
    Notice.shown = [];
  });

  it("asks for a name, and hands what was typed over to be made", async () => {
    const answers = new Answers(true);
    const modal = opened(answers);
    expect(Reflect.get(modal, "title")).toBe("New campaign");
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
    expect(inputOf(modal).value).toBe("Silver Road");
    expect(buttonSaying(modal, "Make campaign").disabled).toBe(false);
  });

  it("says why when making the campaign fails outright, and stays open", async () => {
    const answers = new Answers(new Error("The disk is full."));
    const modal = opened(answers);
    submit(modal, "Silver Road");
    await settled();
    expect(Notice.shown).toEqual(["Couldn't make the campaign: The disk is full."]);
    expect(answers.opened).toBe(0);
    expect(buttonSaying(modal, "Make campaign").disabled).toBe(false);
  });

  it("makes the campaign when Enter is pressed in the name box", async () => {
    const answers = new Answers(true);
    const modal = opened(answers);
    typeIn(modal, "Silver Road");
    press(modal, "Enter");
    await settled();
    expect(answers.typed).toEqual(["Silver Road"]);
    expect(answers.opened).toBe(1);
  });

  it("makes the campaign once when Enter is pressed again while it is being made", async () => {
    const answers = new Answers("held");
    const modal = opened(answers);
    typeIn(modal, "Silver Road");
    press(modal, "Enter");
    press(modal, "Enter");
    await settled();
    expect(buttonSaying(modal, "Make campaign").disabled).toBe(true);
    answers.release();
    await settled();
    expect(answers.typed).toEqual(["Silver Road"]);
    expect(answers.opened).toBe(1);
  });

  it("puts the cursor in the name when it opens, whatever the frame focuses", () => {
    const view = new MountedView();
    new NewCampaignDialog(OBSIDIAN_TELLING, new Answers(true)).opened(view);
    expect(view.focused()).toBe(view.into.querySelector("input"));
  });

  it("makes nothing when another key is pressed in the name box", async () => {
    const answers = new Answers(true);
    const modal = opened(answers);
    press(modal, "a");
    await settled();
    expect(answers.typed).toEqual([]);
  });

  it("closes without making anything on Cancel", async () => {
    const answers = new Answers(true);
    const modal = opened(answers);
    buttonSaying(modal, "Cancel").click();
    await settled();
    expect(answers.typed).toEqual([]);
    expect(modal.contentEl.querySelector("input")).toBeNull();
  });
});
