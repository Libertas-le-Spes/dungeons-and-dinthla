import { vi } from "vitest";
import type { App, TFile } from "obsidian";
import type { ImportFlow } from "../../../src/imports/dialog/flows/import-flow";
import { ImportModal } from "../../../src/imports/dialog/import-modal";
import type { OnlineSource } from "../../../src/imports/dialog/online/online-source";
import { obsidianDocument } from "../../stubs/obsidian-dom";

export interface PickedFile {
  readonly size: number;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export function pickedFileOf(bytes: Uint8Array): PickedFile {
  return { size: bytes.byteLength, arrayBuffer: vi.fn(bufferOf(bytes)) };
}

function bufferOf(bytes: Uint8Array): () => Promise<ArrayBuffer> {
  return async function buffer(): Promise<ArrayBuffer> {
    return new Uint8Array(bytes).buffer;
  };
}

export interface DialogSetup {
  readonly today: string;
  readonly online: OnlineSource;
}

export class DialogDriver {
  readonly closed = vi.fn();
  readonly modal: ImportModal;

  constructor(flow: ImportFlow, setup: DialogSetup) {
    this.modal = new ImportModal({} as App, { flow, today: setup.today, online: setup.online, onClosed: { importClosed: this.closed } });
    obsidianDocument().body.append(this.modal.contentEl);
    this.modal.open();
  }

  get root(): HTMLElement {
    return this.modal.contentEl;
  }

  pick(file: PickedFile): void {
    this.pickFrom({ item: itemOf(file) });
  }

  pickNothing(): void {
    this.pickFrom({ item: nothingAt });
  }

  private pickFrom(list: { item(position: number): PickedFile | null }): void {
    const input = this.root.querySelector<HTMLInputElement>('input[type="file"]');
    if (input === null) throw new Error("The dialog shows no file picker.");
    Object.defineProperty(input, "files", { value: list, configurable: true });
    const view = input.ownerDocument.defaultView;
    if (view === null) throw new Error("The dialog is not in a window.");
    input.dispatchEvent(new view.Event("change"));
  }

  typeLink(text: string): void {
    const input = this.root.querySelector<HTMLInputElement>(".setting-item-control input");
    if (input === null) throw new Error("The dialog shows no box for the link.");
    input.value = text;
    const view = input.ownerDocument.defaultView;
    if (view === null) throw new Error("The dialog is not in a window.");
    input.dispatchEvent(new view.Event("input"));
  }

  linkBox(): string | null {
    const input = this.root.querySelector<HTMLInputElement>(".setting-item-control input");
    if (input === null) return null;
    return input.value;
  }

  async settled(selector: string): Promise<HTMLElement> {
    await this.modal.allSettled();
    const element = this.root.querySelector<HTMLElement>(selector);
    if (element === null) throw new Error(`Nothing matches ${selector}.`);
    return element;
  }

  texts(selector: string): string[] {
    const found: string[] = [];
    for (const element of this.root.querySelectorAll(selector)) found.push(String(element.textContent));
    return found;
  }

  press(words: string): void {
    for (const button of this.root.querySelectorAll<HTMLButtonElement>("button")) {
      if (button.textContent === words) {
        button.click();
        return;
      }
    }
    throw new Error(`No button says ${words}.`);
  }
}

function itemOf(file: PickedFile): (position: number) => PickedFile | null {
  return function item(position: number): PickedFile | null {
    if (position === 0) return file;
    return null;
  };
}

function nothingAt(): null {
  return null;
}

export function noteNamed(files: Iterable<TFile>, path: string): TFile {
  for (const file of files) {
    if (file.path === path) return file;
  }
  throw new Error(`No note at ${path}.`);
}
