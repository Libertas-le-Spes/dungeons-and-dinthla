import { Component } from "obsidian";

export interface TabsParts {
  parent: HTMLElement;
  label: string;
  first: string;
  second: string;
}

interface Move {
  key: string;
  from: number;
  count: number;
}

interface Place {
  prefix: string;
  index: number;
}

interface TabIds {
  tab: string;
  panel: string;
}

let tabsMade = 0;

function idsOf({ prefix, index }: Place): TabIds {
  return { tab: `${prefix}-tab-${index}`, panel: `${prefix}-panel-${index}` };
}

function targetOf({ key, from, count }: Move): number | null {
  if (key === "ArrowRight") return (from + 1) % count;
  if (key === "ArrowLeft") return (from + count - 1) % count;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}

export class Tabs extends Component {
  readonly firstPanel: HTMLElement;
  readonly secondPanel: HTMLElement;
  private readonly names: string[];
  private readonly buttons: HTMLElement[] = [];
  private readonly panels: HTMLElement[] = [];

  constructor(parts: TabsParts) {
    super();
    const { label, first, second } = parts;
    tabsMade += 1;
    const prefix = `dd-tabs-${tabsMade}`;
    this.names = [first, second];
    const list = parts.parent.createDiv({ cls: "dd-tabs", attr: { role: "tablist", "aria-label": label } });
    for (const [index, name] of this.names.entries()) {
      const ids = idsOf({ prefix, index });
      const button = list.createEl("button", {
        cls: "dd-tab",
        text: name,
        attr: { role: "tab", id: ids.tab, "aria-controls": ids.panel },
      });
      this.registerDomEvent(button, "click", () => this.selectAt({ selected: index, focus: false }));
      this.registerDomEvent(button, "keydown", (event) => this.moveFrom({ index, event }));
      this.buttons.push(button);
    }
    this.firstPanel = this.addPanel({ within: parts.parent, place: { prefix, index: 0 } });
    this.secondPanel = this.addPanel({ within: parts.parent, place: { prefix, index: 1 } });
    this.selectAt({ selected: 0, focus: false });
  }

  private addPanel({ within, place }: { within: HTMLElement; place: Place }): HTMLElement {
    const ids = idsOf(place);
    const panel = within.createDiv({ cls: "dd-tab-panel", attr: { role: "tabpanel", id: ids.panel, "aria-labelledby": ids.tab } });
    this.panels.push(panel);
    return panel;
  }

  select(name: string): void {
    this.selectAt({ selected: this.names.indexOf(name), focus: false });
  }

  private moveFrom({ index, event }: { index: number; event: KeyboardEvent }): void {
    const target = targetOf({ key: event.key, from: index, count: this.buttons.length });
    if (target === null) return;
    event.preventDefault();
    this.selectAt({ selected: target, focus: true });
  }

  private selectAt({ selected, focus }: { selected: number; focus: boolean }): void {
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
