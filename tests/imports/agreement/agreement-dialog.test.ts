import { afterEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import { AgreementDialog } from "../../../src/imports/agreement/agreement-dialog";
import { AGREEMENT_PARAGRAPHS, AGREEMENT_TITLE } from "../../../src/imports/agreement/agreement-words";
import { Modal, nextModal } from "../../stubs/obsidian";
import { pressOn, textsIn } from "./shown-parts";

const NO_APP = {} as App;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the first press's dialog", () => {
  it("shows the agreement's title and words with Continue and Use a PDF instead", async () => {
    const setTitle = vi.spyOn(Modal.prototype, "setTitle");
    const opened = nextModal();
    void new AgreementDialog(NO_APP).ask();
    const modal = await opened;
    expect(setTitle).toHaveBeenCalledExactlyOnceWith(AGREEMENT_TITLE);
    expect(textsIn(modal.contentEl, ".dd-agreement-words")).toEqual(AGREEMENT_PARAGRAPHS);
    expect(textsIn(modal.contentEl, "button")).toEqual(["Continue", "Use a PDF instead"]);
  });

  it("answers agreed on Continue and closes", async () => {
    const opened = nextModal();
    const asked = new AgreementDialog(NO_APP).ask();
    const modal = await opened;
    pressOn(modal.contentEl, "Continue");
    expect((await asked).agreed).toBe(true);
    expect(modal.contentEl.childElementCount).toBe(0);
  });

  it("answers not yet on Use a PDF instead and closes", async () => {
    const opened = nextModal();
    const asked = new AgreementDialog(NO_APP).ask();
    const modal = await opened;
    pressOn(modal.contentEl, "Use a PDF instead");
    expect((await asked).agreed).toBe(false);
    expect(modal.contentEl.childElementCount).toBe(0);
  });

  it("answers not yet when closed without a choice", async () => {
    const opened = nextModal();
    const asked = new AgreementDialog(NO_APP).ask();
    const modal = await opened;
    modal.close();
    expect((await asked).agreed).toBe(false);
  });

  it("answers not yet when closed without a choice after an earlier Continue", async () => {
    const dialog = new AgreementDialog(NO_APP);
    const firstOpened = nextModal();
    const first = dialog.ask();
    pressOn((await firstOpened).contentEl, "Continue");
    await first;
    const secondOpened = nextModal();
    const second = dialog.ask();
    (await secondOpened).close();
    expect((await second).agreed).toBe(false);
  });
});
