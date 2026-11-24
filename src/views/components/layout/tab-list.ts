import { HandleRequest, KeyBinding, PressBinding } from "../../elements/bindings/bindings";
import { KeptHandle } from "../../elements/bindings/kept-handle";
import type { OpenPlace } from "../../elements/bindings/open-place";
import type { PageAction } from "../../elements/bindings/page-action";
import type { ElementHandle } from "../../elements/element-handle";
import { Button, Div } from "../../elements/kinds/containers";
import type { ViewElement } from "../../elements/view-element";

let tabListsMade = 0;

interface TabIds {
  readonly tab: string;
  readonly panel: string;
}

class Choose implements PageAction {
  constructor(
    private readonly tabs: TabList,
    private readonly index: number,
    private readonly focus: boolean,
  ) {}

  run(_place: OpenPlace): void {
    this.tabs.selectAt(this.index, this.focus);
  }
}

export class TabList {
  private readonly prefix: string;
  private readonly buttons: KeptHandle[] = [];
  private readonly panels: KeptHandle[] = [];

  constructor(
    private readonly label: string,
    private readonly names: readonly string[],
  ) {
    tabListsMade += 1;
    this.prefix = `dd-tabs-${tabListsMade}`;
  }

  build(): ViewElement[] {
    const buttons: Button[] = [];
    for (const [index, name] of this.names.entries()) buttons.push(this.button(index, name));
    const built: ViewElement[] = [new Div({ cls: ["dd-tabs"], role: "tablist", label: this.label }, buttons)];
    for (const index of this.names.keys()) built.push(this.panel(index));
    return built;
  }

  select(name: string): void {
    this.selectAt(this.names.indexOf(name), false);
  }

  panelAt(index: number): ElementHandle | null {
    const kept = this.panels[index];
    if (kept === undefined) return null;
    return kept.handle;
  }

  selectAt(selected: number, focus: boolean): void {
    for (const [index, kept] of this.buttons.entries()) this.markButton(kept.handle, index === selected, focus);
    for (const [index, kept] of this.panels.entries()) this.markPanel(kept.handle, index !== selected);
  }

  private markPanel(handle: ElementHandle | null, hidden: boolean): void {
    if (handle !== null) handle.setHidden(hidden);
  }

  private markButton(handle: ElementHandle | null, isSelected: boolean, focus: boolean): void {
    if (handle === null) return;
    handle.setSelected(isSelected);
    if (isSelected) handle.setTabIndex(0);
    else handle.setTabIndex(-1);
    if (isSelected && focus) handle.focus();
  }

  private idsOf(index: number): TabIds {
    return { tab: `${this.prefix}-tab-${index}`, panel: `${this.prefix}-panel-${index}` };
  }

  private button(index: number, name: string): Button {
    const ids = this.idsOf(index);
    const kept = new KeptHandle();
    this.buttons.push(kept);
    const count = this.names.length;
    const bindings = [
      new PressBinding(new Choose(this, index, false)),
      new KeyBinding(["ArrowRight"], new Choose(this, (index + 1) % count, true)),
      new KeyBinding(["ArrowLeft"], new Choose(this, (index + count - 1) % count, true)),
      new KeyBinding(["Home"], new Choose(this, 0, true)),
      new KeyBinding(["End"], new Choose(this, count - 1, true)),
      new HandleRequest(kept),
    ];
    return new Button({ cls: ["dd-tab"], text: name, role: "tab", id: ids.tab, controls: ids.panel, bindings });
  }

  private panel(index: number): Div {
    const ids = this.idsOf(index);
    const kept = new KeptHandle();
    this.panels.push(kept);
    return new Div({ cls: ["dd-tab-panel"], role: "tabpanel", id: ids.panel, labelledBy: ids.tab, bindings: [new HandleRequest(kept)] });
  }
}
