import { Component } from "obsidian";

export interface TabParts {
  name: string;
  fill(panel: HTMLElement): void;
}

export interface TabsParts {
  parent: HTMLElement;
  label: string;
  tabs: readonly TabParts[];
}

interface Move {
  key: string;
  from: number;
  count: number;
}

function targetOf({ key, from, count }: Move): number | null {
  if (key === "ArrowRight") return (from + 1) % count;
  if (key === "ArrowLeft") return (from + count - 1) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

export class Tabs extends Component {
  private readonly buttons: HTMLElement[] = [];
  private readonly panels: HTMLElement[] = [];

  constructor(private readonly parts: TabsParts) {
    super();
  }

  override onload(): void {
    const { label, tabs } = this.parts;
    const list = this.parts.parent.createDiv({ cls: "dd-tabs", attr: { role: "tablist", "aria-label": label } });
    for (const [index, tab] of tabs.entries()) {
      const button = list.createEl("button", { cls: "dd-tab", text: tab.name, attr: { role: "tab" } });
      this.registerDomEvent(button, "click", () => this.select({ selected: index, focus: false }));
      this.registerDomEvent(button, "keydown", (event) => this.moveFrom({ index, event }));
      this.buttons.push(button);
    }
    for (const tab of tabs) {
      const panel = this.parts.parent.createDiv({ cls: "dd-tab-panel", attr: { role: "tabpanel", "aria-label": tab.name } });
      tab.fill(panel);
      this.panels.push(panel);
    }
    this.select({ selected: 0, focus: false });
  }

  private moveFrom({ index, event }: { index: number; event: KeyboardEvent }): void {
    const target = targetOf({ key: event.key, from: index, count: this.buttons.length });
    if (target === null) return;
    event.preventDefault();
    this.select({ selected: target, focus: true });
  }

  private select({ selected, focus }: { selected: number; focus: boolean }): void {
    for (const [index, button] of this.buttons.entries()) {
      const isSelected = index === selected;
      button.setAttr("aria-selected", String(isSelected));
      if (isSelected) button.setAttr("tabindex", "0");
      else button.setAttr("tabindex", "-1");
      if (isSelected && focus) button.focus();
    }
    for (const [index, panel] of this.panels.entries()) panel.toggle(index === selected);
  }
}
