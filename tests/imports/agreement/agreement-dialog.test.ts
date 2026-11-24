import { afterEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { agreementDialogIn } from "../../../src/imports/agreement/agreement-dialog";
import { obsidianDialogsOf } from "../../../src/obsidian/views/frames/modal-frame";
import { AGREEMENT_PARAGRAPHS, AGREEMENT_TITLE } from "../../../src/imports/agreement/agreement-words";
import { Modal, nextModal } from "../../stubs/obsidian";
import { pressOn, textsIn } from "./shown-parts";

const ASKING = agreementDialogIn(obsidianDialogsOf({} as App));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the first press's dialog", () => {
  it("shows the agreement's title and words with Cancel, then Import as the highlighted button", async () => {
    const setTitle = vi.spyOn(Modal.prototype, "setTitle");
    const opened = nextModal();
    void ASKING.ask();
    const modal = await opened;
    expect(setTitle).toHaveBeenCalledExactlyOnceWith(AGREEMENT_TITLE);
    expect(textsIn(modal.contentEl, ".dd-agreement-words")).toEqual(AGREEMENT_PARAGRAPHS);
    expect(textsIn(modal.contentEl, "button")).toEqual(["Cancel", "Import"]);
    expect(textsIn(modal.contentEl, "button.mod-cta")).toEqual(["Import"]);
  });

  it("answers agreed on Import and closes", async () => {
    const opened = nextModal();
    const asked = ASKING.ask();
    const modal = await opened;
    pressOn(modal.contentEl, "Import");
    expect((await asked).agreed).toBe(true);
    expect(modal.contentEl.childElementCount).toBe(0);
  });

  it("answers not yet on Cancel and closes", async () => {
    const opened = nextModal();
    const asked = ASKING.ask();
    const modal = await opened;
    pressOn(modal.contentEl, "Cancel");
    expect((await asked).agreed).toBe(false);
    expect(modal.contentEl.childElementCount).toBe(0);
  });

  it("answers not yet when closed without a choice", async () => {
    const opened = nextModal();
    const asked = ASKING.ask();
    const modal = await opened;
    modal.close();
    expect((await asked).agreed).toBe(false);
  });

  it("answers not yet when closed without a choice after an earlier Import", async () => {
    const dialog = ASKING;
    const firstOpened = nextModal();
    const first = dialog.ask();
    pressOn((await firstOpened).contentEl, "Import");
    await first;
    const secondOpened = nextModal();
    const second = dialog.ask();
    (await secondOpened).close();
    expect((await second).agreed).toBe(false);
  });
});
