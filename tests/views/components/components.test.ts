import { describe, expect, it, vi } from "vitest";
import { scrollListParts } from "../../../src/views/components/layout/scroll-list";
import { Folded } from "../../../src/views/components/layout/folded";
import { Panel } from "../../../src/views/components/layout/panel";
import { TabList } from "../../../src/views/components/layout/tab-list";
import { LinkName } from "../../../src/views/components/rows/link-name";
import { SourceRow } from "../../../src/views/components/rows/source-row";
import { Empty } from "../../../src/views/components/words/empty";
import { Title } from "../../../src/views/components/words/title";
import { FieldRow, List, ListItem, Span } from "../../../src/views/elements/kinds/containers";
import { HERE } from "../../../src/views/elements/bindings/open-place";
import type { ViewElement } from "../../../src/views/elements/view-element";
import { mountTree } from "../../../src/obsidian/views/mount/mount-tree";
import { obsidianDocument } from "../../stubs/obsidian-dom";
import { Paragraph } from "../../../src/views/elements/kinds/containers";

const SOURCE = { path: "D&D/Pale Moon/Sessions/Session 1.md", line: 3 };

function root(): HTMLElement {
  const el = obsidianDocument().createElement("div");
  el.ownerDocument.body.append(el);
  return el;
}

function mounted(...trees: ViewElement[]): HTMLElement {
  const el = root();
  for (const tree of trees) mountTree(tree, el);
  return el;
}

describe("the plugin's own components", () => {
  it("draws a row as a button the keyboard reaches, keyed to its line, opening on a press or Enter", () => {
    const open = { run: vi.fn() };
    const built = mounted(new ListItem({}, [new SourceRow(SOURCE, open).build([])]));
    expect(built.innerHTML).toBe('<li><div class="dd-row" role="button" tabindex="0" data-path="D&amp;D/Pale Moon/Sessions/Session 1.md" data-line="3"></div></li>');
    const row = built.querySelector(".dd-row") as HTMLElement;
    const view = row.ownerDocument.defaultView!;
    row.dispatchEvent(new view.MouseEvent("click"));
    row.dispatchEvent(new view.KeyboardEvent("keydown", { key: " ", cancelable: true }));
    expect(open.run.mock.calls).toEqual([[HERE], [HERE]]);
  });

  it("draws a link name as a link the keyboard reaches, following it here or in a new tab, never into the row, never dragged", () => {
    const opener = { openLink: vi.fn() };
    const built = mounted(new LinkName("Mira", SOURCE.path, opener).build("Mira"));
    expect(built.innerHTML).toBe('<a class="dd-link-name" role="link" tabindex="0" draggable="false">Mira</a>');
    const link = built.querySelector("a")!;
    const view = link.ownerDocument.defaultView!;
    const rowClicked = vi.fn();
    built.addEventListener("click", rowClicked);
    link.dispatchEvent(new view.MouseEvent("click", { bubbles: true, cancelable: true }));
    link.dispatchEvent(new view.MouseEvent("auxclick", { button: 1, bubbles: true }));
    link.dispatchEvent(new view.KeyboardEvent("keydown", { key: "Enter" }));
    const drag = new view.Event("dragstart", { cancelable: true });
    link.dispatchEvent(drag);
    expect(opener.openLink.mock.calls).toEqual([
      ["Mira", SOURCE.path, false],
      ["Mira", SOURCE.path, true],
      ["Mira", SOURCE.path, false],
    ]);
    expect(rowClicked).not.toHaveBeenCalled();
    expect(drag.defaultPrevented).toBe(true);
  });

  it("makes a list a scroll list the keyboard can reach, named for readers", () => {
    const built = mounted(new List(scrollListParts({ cls: ["dd-ledger"] }, "Ledger")));
    expect(built.innerHTML).toBe('<ul class="dd-ledger dd-scroll-list" aria-label="Ledger" tabindex="0"></ul>');
  });

  it("draws a fold as details with its title in the summary first", () => {
    const fold = mounted(new Folded(["dd-import-fold"], "Properties (3)").build([new Paragraph({ text: "AC: 15 → 16" })])).firstElementChild!;
    expect(fold.tagName).toBe("DETAILS");
    expect(fold.className).toBe("dd-import-fold");
    expect(Array.from(fold.children).map((child) => `${child.tagName} ${child.textContent}`)).toEqual(["SUMMARY Properties (3)", "P AC: 15 → 16"]);
  });

  it("draws two tabs with the first chosen, each tied to its panel, and moves between them with the arrow keys", () => {
    const tabs = new TabList("Funds", ["Mine", "Party"]);
    const built = mounted(...tabs.build([[new Span({ text: "mine" })], [new Span({ text: "party" })]]));
    tabs.selectAt(0, false);
    const buttons = Array.from(built.querySelectorAll("button"));
    const panels = Array.from(built.querySelectorAll("[role=tabpanel]"));
    expect(built.querySelector("[role=tablist]")!.getAttribute("aria-label")).toBe("Funds");
    expect(buttons.map((button) => [button.textContent, button.getAttribute("aria-selected"), button.getAttribute("tabindex")])).toEqual([["Mine", "true", "0"], ["Party", "false", "-1"]]);
    expect(buttons.map((button) => button.getAttribute("aria-controls"))).toEqual(panels.map((panel) => panel.id));
    expect(panels.map((panel) => panel.getAttribute("aria-labelledby"))).toEqual(buttons.map((button) => button.id));
    expect(panels.map((panel) => panel.textContent)).toEqual(["mine", "party"]);
    const [mine] = Array.from(built.querySelectorAll("button"));
    const view = mine!.ownerDocument.defaultView!;
    mine!.dispatchEvent(new view.KeyboardEvent("keydown", { key: "ArrowRight", cancelable: true }));
    expect(Array.from(built.querySelectorAll("button")).map((button) => button.getAttribute("aria-selected"))).toEqual(["false", "true"]);
    expect(Array.from(built.querySelectorAll("[role=tabpanel]")).map((panel) => (panel as HTMLElement).style.display)).toEqual(["none", ""]);
    tabs.select("Mine");
    expect(built.querySelector("button")!.getAttribute("tabindex")).toBe("0");
  });

  it("gives each tab list its own ids, so two never share one", () => {
    const first = new TabList("A", ["One", "Two"]);
    const second = new TabList("B", ["One", "Two"]);
    const ids = [mounted(...first.build([[], []])), mounted(...second.build([[], []]))].map((el) => el.querySelector("button")!.id);
    expect(ids[0]).not.toBe(ids[1]);
  });

  it("draws a panel, a counted title and an empty line with the plugin's own classes", () => {
    const built = mounted(new Panel(["dd-items-panel"]).build([new Title("Items").counted("2 held"), new Empty("Nothing yet.").build()]));
    expect(built.innerHTML).toBe('<section class="dd-panel dd-items-panel"><h2 class="dd-title">Items<span class="dd-count">2 held</span></h2><p class="dd-empty">Nothing yet.</p></section>');
  });

  it("draws a field row as Obsidian's settings row, with the controls inside its control", () => {
    const built = mounted(new FieldRow("Held by", "Who has it now", [new Span({ text: "control" })]));
    expect(built.innerHTML).toBe(
      '<div class="setting-item"><div class="setting-item-info"><div class="setting-item-name">Held by</div><div class="setting-item-description">Who has it now</div></div><div class="setting-item-control"><span>control</span></div></div>',
    );
  });
});

