import type { App } from "obsidian";
import { NameSuggest } from "./name-suggest";

const NO_SUGGESTING = "Names can only be suggested in a frame that has Obsidian's app.";

export class PlainKit {
  suggestNames(_input: HTMLInputElement, _names: readonly string[]): void {
    throw new Error(NO_SUGGESTING);
  }
}

export class AppKit {
  constructor(private readonly app: App) {}

  suggestNames(input: HTMLInputElement, names: readonly string[]): void {
    new NameSuggest(this.app, input, names);
  }
}

export type MountKit = PlainKit | AppKit;

export const PLAIN_KIT: MountKit = new PlainKit();
