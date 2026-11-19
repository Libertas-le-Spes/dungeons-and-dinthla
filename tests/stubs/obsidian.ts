import { StateField } from "@codemirror/state";
import type {
  AbstractInputSuggest as RealInputSuggest,
  BasesView as RealBasesView,
  FrontMatterInfo,
  FuzzySuggestModal as RealFuzzySuggestModal,
  ItemView as RealItemView,
  MarkdownFileInfo,
  ViewState,
  Modal as RealModal,
  Plugin as RealPlugin,
  PluginSettingTab as RealPluginSettingTab,
  RequestUrlParam,
  RequestUrlResponse,
} from "obsidian";
import { obsidianDocument } from "./obsidian-dom";

export class Plugin {
  app: RealPlugin["app"];
  manifest: RealPlugin["manifest"];

  constructor(...[app, manifest]: ConstructorParameters<typeof RealPlugin>) {
    this.app = app;
    this.manifest = manifest;
  }
}

export class Component {
  private loaded = false;
  private readonly children: Component[] = [];
  private readonly cleanups: (() => void)[] = [];

  load(): void {
    if (this.loaded) return;
    this.loaded = true;
    this.onload();
    for (const child of this.children.slice()) child.load();
  }

  onload(): void {}

  unload(): void {
    if (!this.loaded) return;
    this.loaded = false;
    while (this.children.length > 0) this.children.pop()!.unload();
    while (this.cleanups.length > 0) this.cleanups.pop()!();
    this.onunload();
  }

  onunload(): void {}

  addChild<T extends Component>(child: T): T {
    this.children.push(child);
    if (this.loaded) child.load();
    return child;
  }

  removeChild<T extends Component>(child: T): T {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.unload();
    }
    return child;
  }

  register(cleanup: () => void): void {
    this.cleanups.push(cleanup);
  }

  registerDomEvent(element: HTMLElement, type: string, callback: (event: Event) => void): void {
    element.addEventListener(type, callback);
    this.register(() => element.removeEventListener(type, callback));
  }
}

type EventCallback = (...data: unknown[]) => unknown;

interface HeldEvent {
  e: Events;
  name: string;
  fn: EventCallback;
}

export class Events {
  private held: HeldEvent[] = [];

  on(name: string, callback: EventCallback): HeldEvent {
    const ref = { e: this, name, fn: callback };
    this.held.push(ref);
    return ref;
  }

  off(name: string, callback: EventCallback): void {
    this.held = this.held.filter((ref) => ref.name !== name || ref.fn !== callback);
  }

  offref(ref: HeldEvent): void {
    this.held = this.held.filter((each) => each !== ref);
  }

  trigger(name: string, ...data: unknown[]): void {
    for (const ref of this.held.filter((each) => each.name === name)) ref.fn(...data);
  }

  tryTrigger(ref: HeldEvent, data: unknown[]): void {
    ref.fn(...data);
  }
}

export class ItemView extends Component {
  app!: RealItemView["app"];
  navigation = false;
  leaf: RealItemView["leaf"];
  contentEl!: HTMLElement;
  containerEl: HTMLElement;

  constructor(...[leaf]: ConstructorParameters<typeof RealItemView>) {
    super();
    this.leaf = leaf;
    this.containerEl = obsidianDocument().createElement("div");
    this.containerEl.setAttribute("data-type", this.getViewType());
  }

  getViewType(): string {
    return "";
  }

  getState(): Record<string, unknown> {
    return {};
  }

  async setState(..._args: Parameters<RealItemView["setState"]>): Promise<void> {}

  setEphemeralState(_state: unknown): void {}
}

const MIDDLE_BUTTON = 1;

export class Keymap {
  static isModEvent(event: MouseEvent | KeyboardEvent): "tab" | false {
    if (event.ctrlKey || event.metaKey) return "tab";
    if ("button" in event && event.button === MIDDLE_BUTTON) return "tab";
    return false;
  }
}

export class WorkspaceLeaf {
  async setViewState(_viewState: ViewState, _eState?: unknown): Promise<void> {}
}

export class BasesView {
  data!: RealBasesView["data"];

  constructor(..._controller: unknown[]) {}

  register(): void {}
}

export { parseYaml } from "./parse-yaml";

export function stringifyYaml(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

export class Notice {
  static shown: string[] = [];

  constructor(message: string) {
    Notice.shown.push(message);
  }
}

export class MenuItem {
  title = "";
  icon = "";
  checked = false;
  separator = false;
  click: () => unknown = () => {};

  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  setIcon(icon: string): this {
    this.icon = icon;
    return this;
  }

  setChecked(checked: boolean): this {
    this.checked = checked;
    return this;
  }

  onClick(click: () => unknown): this {
    this.click = click;
    return this;
  }
}

export class Menu {
  static shown: Menu[] = [];
  readonly items: MenuItem[] = [];
  position: { x: number; y: number } | null = null;
  private readonly hiding: (() => unknown)[] = [];

  addItem(build: (item: MenuItem) => void): this {
    const item = new MenuItem();
    build(item);
    this.items.push(item);
    return this;
  }

  addSeparator(): this {
    const item = new MenuItem();
    item.separator = true;
    this.items.push(item);
    return this;
  }

  onHide(callback: () => unknown): void {
    this.hiding.push(callback);
  }

  hide(): this {
    for (const callback of this.hiding) callback();
    return this;
  }

  showAtPosition(position: { x: number; y: number }): this {
    this.position = position;
    Menu.shown.push(this);
    return this;
  }
}

export function setIcon(parent: HTMLElement, icon: string): void {
  parent.setAttribute("data-icon", icon);
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

type ModalWaiter = (modal: Modal) => void;

let modalWaiters: ModalWaiter[] = [];

function waitForModal(opened: ModalWaiter): void {
  modalWaiters.push(opened);
}

export function nextModal(): Promise<Modal> {
  return new Promise(waitForModal);
}

export function forgetModalWaiters(): void {
  modalWaiters = [];
}

function tellModalWaiters(modal: Modal): void {
  const waiters = modalWaiters;
  modalWaiters = [];
  for (const opened of waiters) opened(modal);
}

const FOCUSABLE = "button, input, select, textarea, [tabindex]";

function focusFirstIn(element: HTMLElement): void {
  const first = element.querySelector<HTMLElement>(FOCUSABLE);
  if (first !== null) first.focus();
}

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
    focusFirstIn(this.contentEl);
    tellModalWaiters(this);
  }

  close(): void {
    this.onClose();
  }

  onOpen(): void {}

  onClose(): void {}
}

class AbstractTextComponent<T extends HTMLInputElement | HTMLTextAreaElement> {
  constructor(readonly inputEl: T) {}

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

class TextComponent extends AbstractTextComponent<HTMLInputElement> {
  constructor(containerEl: HTMLElement) {
    super(containerEl.createEl("input"));
  }
}

class TextAreaComponent extends AbstractTextComponent<HTMLTextAreaElement> {
  constructor(containerEl: HTMLElement) {
    super(containerEl.createEl("textarea"));
  }
}

export class MarkdownView {}

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
    this.buttonEl.addClass("mod-cta");
    return this;
  }

  setWarning(): this {
    this.buttonEl.addClass("mod-warning");
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

  addTextArea(build: (area: TextAreaComponent) => void): this {
    build(new TextAreaComponent(this.controlEl));
    return this;
  }

}

export function normalizePath(path: string): string {
  let normalized = path.replace(/[\\/]+/g, "/").replace(/^\/+|\/+$/g, "");
  if (normalized === "") normalized = "/";
  return normalized.replace(/ | /g, " ").normalize("NFC");
}

export function getLinkpath(linktext: string): string {
  return linktext.replace(/#.*$/, "");
}

export function parseLinktext(linktext: string): { path: string; subpath: string } {
  const hash = linktext.indexOf("#");
  if (hash === -1) return { path: linktext, subpath: "" };
  return { path: linktext.slice(0, hash), subpath: linktext.slice(hash) };
}

export function debounce<T extends unknown[]>(callback: (...args: T) => void): ((...args: T) => void) & { cancel: () => void } {
  const debouncer = (...args: T) => callback(...args);
  debouncer.cancel = () => {};
  return debouncer;
}

export const Platform = {
  isDesktopApp: true,
  isMobileApp: false,
  isIosApp: false,
  isAndroidApp: false,
};

export class TAbstractFile {
  path = "";
  name = "";
}

export class TFile extends TAbstractFile {
  basename = "";
  extension = "";
}

export class TFolder extends TAbstractFile {
  children: TAbstractFile[] = [];
}

export class Vault {
  static recurseChildren(root: TFolder, visit: (file: TAbstractFile) => unknown): void {
    visit(root);
    for (const child of root.children) {
      if (child instanceof TFolder) Vault.recurseChildren(child, visit);
      else visit(child);
    }
  }
}

export const urlsAsked: RequestUrlParam[] = [];

type UrlAnswer = (options: RequestUrlParam) => Promise<RequestUrlResponse>;

let answeringUrls: UrlAnswer | null = null;

export function answerUrlsWith(answer: UrlAnswer): void {
  answeringUrls = answer;
}

export function forgetUrls(): void {
  urlsAsked.length = 0;
  answeringUrls = null;
}

export async function requestUrl(options: RequestUrlParam): Promise<RequestUrlResponse> {
  urlsAsked.push(options);
  if (answeringUrls === null) throw new Error("A test reached requestUrl without saying what it answers, so nothing was sent.");
  return answeringUrls(options);
}
