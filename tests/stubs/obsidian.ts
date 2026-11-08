import { StateField } from "@codemirror/state";
import type {
  AbstractInputSuggest as RealInputSuggest,
  BasesView as RealBasesView,
  EditorSuggest as RealEditorSuggest,
  EditorSuggestContext,
  FrontMatterInfo,
  FuzzySuggestModal as RealFuzzySuggestModal,
  ItemView as RealItemView,
  MarkdownFileInfo,
  Modal as RealModal,
  Plugin as RealPlugin,
  PluginSettingTab as RealPluginSettingTab,
} from "obsidian";
import { obsidianDocument } from "../views/obsidian-dom";

export class Plugin {
  app: RealPlugin["app"];
  manifest: RealPlugin["manifest"];

  constructor(...[app, manifest]: ConstructorParameters<typeof RealPlugin>) {
    this.app = app;
    this.manifest = manifest;
  }
}

export class ItemView {
  leaf: RealItemView["leaf"];
  contentEl!: HTMLElement;

  constructor(...[leaf]: ConstructorParameters<typeof RealItemView>) {
    this.leaf = leaf;
  }

  registerDomEvent(element: HTMLElement, type: string, callback: (event: Event) => void): void {
    element.addEventListener(type, callback);
  }

  register(): void {}
}

export class BasesView {
  data!: RealBasesView["data"];

  constructor(..._controller: unknown[]) {}

  register(): void {}
}

export function stringifyYaml(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export class Notice {
  static shown: string[] = [];

  constructor(message: string) {
    Notice.shown.push(message);
  }
}

const PROPERTIES_OPEN = /^---\r?\n/;

export function getFrontMatterInfo(content: string): FrontMatterInfo {
  const none = { exists: false, frontmatter: "", from: 0, to: 0, contentStart: 0 };
  const opening = PROPERTIES_OPEN.exec(content);
  if (opening === null) return none;
  const from = opening[0].length;
  const closing = /---(?:\r?\n|$)/g;
  closing.lastIndex = from;
  let close = closing.exec(content);
  while (close !== null && content.charAt(close.index - 1) !== "\n") close = closing.exec(content);
  if (close === null) return none;
  return {
    exists: true,
    frontmatter: content.slice(from, close.index),
    from,
    to: close.index,
    contentStart: close.index + close[0].length,
  };
}

export const editorInfoField = StateField.define<MarkdownFileInfo>({
  create: () => ({ file: null }) as unknown as MarkdownFileInfo,
  update: (info) => info,
});

export const openedModals: Modal[] = [];

export class Modal {
  app: RealModal["app"];
  contentEl: HTMLElement = obsidianDocument().createElement("div");
  title = "";

  constructor(...[app]: ConstructorParameters<typeof RealModal>) {
    this.app = app;
  }

  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  open(): void {
    openedModals.push(this);
    this.onOpen();
  }

  close(): void {
    this.onClose();
  }

  onOpen(): void {}

  onClose(): void {}
}

class TextComponent {
  readonly inputEl: HTMLInputElement;

  constructor(containerEl: HTMLElement) {
    this.inputEl = containerEl.createEl("input");
  }

  setPlaceholder(placeholder: string): this {
    this.inputEl.placeholder = placeholder;
    return this;
  }

  setValue(value: string): this {
    this.inputEl.value = value;
    return this;
  }

  onChange(callback: (value: string) => void): this {
    this.inputEl.addEventListener("input", () => callback(this.inputEl.value));
    return this;
  }
}

export class MarkdownView {}

export class EditorSuggest {
  app: RealEditorSuggest<unknown>["app"];
  context: EditorSuggestContext | null = null;
  limit = 100;

  constructor(...[app]: ConstructorParameters<typeof RealEditorSuggest>) {
    this.app = app;
  }

  close(): void {}
}

export class AbstractInputSuggest {
  app: RealInputSuggest<unknown>["app"];

  constructor(...[app]: ConstructorParameters<typeof RealInputSuggest>) {
    this.app = app;
  }
}

export class PluginSettingTab {
  app: RealPluginSettingTab["app"];
  containerEl!: HTMLElement;

  constructor(...[app]: ConstructorParameters<typeof RealPluginSettingTab>) {
    this.app = app;
  }

  hide(): void {}
}

export const openedSuggestModals: unknown[] = [];

export class FuzzySuggestModal {
  app: RealFuzzySuggestModal<unknown>["app"];
  placeholder = "";

  constructor(...[app]: ConstructorParameters<typeof RealFuzzySuggestModal>) {
    this.app = app;
  }

  setPlaceholder(placeholder: string): void {
    this.placeholder = placeholder;
  }

  open(): void {
    openedSuggestModals.push(this);
  }
}

export class DropdownComponent {
  readonly selectEl: HTMLSelectElement;

  constructor(containerEl: HTMLElement) {
    this.selectEl = containerEl.createEl("select");
  }

  addOption(value: string, display: string): this {
    this.selectEl.createEl("option", { text: display, attr: { value } });
    return this;
  }

  addOptions(options: Record<string, string>): this {
    for (const [value, display] of Object.entries(options)) this.addOption(value, display);
    return this;
  }

  setValue(value: string): this {
    this.selectEl.value = value;
    return this;
  }

  onChange(callback: (value: string) => unknown): this {
    this.selectEl.addEventListener("change", () => callback(this.selectEl.value));
    return this;
  }
}

export class ButtonComponent {
  readonly buttonEl: HTMLButtonElement;

  constructor(containerEl: HTMLElement) {
    this.buttonEl = containerEl.createEl("button");
  }

  setButtonText(text: string): this {
    this.buttonEl.textContent = text;
    return this;
  }

  setDisabled(disabled: boolean): this {
    this.buttonEl.disabled = disabled;
    return this;
  }

  setCta(): this {
    return this;
  }

  setWarning(): this {
    return this;
  }

  onClick(callback: () => unknown): this {
    this.buttonEl.addEventListener("click", () => callback());
    return this;
  }
}

export class Setting {
  readonly settingEl: HTMLElement;
  private readonly nameEl: HTMLElement;
  private readonly descEl: HTMLElement;
  readonly controlEl: HTMLElement;

  constructor(containerEl: HTMLElement) {
    this.settingEl = containerEl.createDiv({ cls: "setting-item" });
    this.nameEl = this.settingEl.createDiv({ cls: "setting-item-name" });
    this.descEl = this.settingEl.createDiv({ cls: "setting-item-description" });
    this.controlEl = this.settingEl.createDiv({ cls: "setting-item-control" });
  }

  setName(name: string): this {
    this.nameEl.setText(name);
    return this;
  }

  setDesc(description: string): this {
    this.descEl.setText(description);
    return this;
  }

  addButton(build: (button: ButtonComponent) => void): this {
    build(new ButtonComponent(this.controlEl));
    return this;
  }

  addDropdown(build: (dropdown: DropdownComponent) => void): this {
    build(new DropdownComponent(this.controlEl));
    return this;
  }

  addText(build: (text: TextComponent) => void): this {
    build(new TextComponent(this.controlEl));
    return this;
  }

}

export function debounce<T extends unknown[]>(callback: (...args: T) => void): ((...args: T) => void) & { cancel: () => void } {
  const debouncer = (...args: T) => callback(...args);
  debouncer.cancel = () => {};
  return debouncer;
}
