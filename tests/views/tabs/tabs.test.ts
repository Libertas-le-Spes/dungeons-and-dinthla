import { describe, expect, it } from "vitest";
import { Tabs } from "../../../src/views/tabs/tabs";
import { obsidianDocument } from "../../stubs/obsidian-dom";

function openTabs() {
  const document = obsidianDocument();
  const parent = document.createElement("div");
  document.body.append(parent);
  const tabs = new Tabs({ parent, label: "Funds", first: "Mine", second: "Party" });
  tabs.load();
  const buttons = Array.from(parent.querySelectorAll<HTMLElement>("[role=tab]"));
  const panels = Array.from(parent.querySelectorAll<HTMLElement>("[role=tabpanel]"));
  const tab = (name: string): HTMLElement => {
    const found = buttons.find((button) => button.textContent === name);
    if (found === undefined) throw new Error(`No tab named ${name}.`);
    return found;
  };
  const press = (button: HTMLElement, key: string) => {
    const window = document.defaultView;
    if (window === null) throw new Error("The test document has no window.");
    const event = new window.KeyboardEvent("keydown", { key, cancelable: true, bubbles: true });
    button.dispatchEvent(event);
    return event;
  };
  return { document, parent, tabs, buttons, panels, tab, press };
}

function selectedOf(buttons: HTMLElement[]): string[] {
  return buttons.map((button) => String(button.getAttribute("aria-selected")));
}

function shownOf(panels: HTMLElement[]): boolean[] {
  return panels.map((panel) => panel.style.display !== "none");
}

describe("Tabs", () => {
  it("makes a labelled tab list, one tab for each name, and a panel for each", () => {
    const { parent, buttons, panels, tabs } = openTabs();
    expect(parent.querySelector("[role=tablist]")?.getAttribute("aria-label")).toBe("Funds");
    expect(buttons.map((button) => button.textContent)).toEqual(["Mine", "Party"]);
    expect(buttons.every((button) => button.tagName === "BUTTON")).toBe(true);
    expect(panels).toEqual([tabs.firstPanel, tabs.secondPanel]);
  });

  it("ties each tab to its panel, and each panel to its tab, by ids that are not shared with another set of tabs", () => {
    const { buttons, panels } = openTabs();
    const other = openTabs();
    expect(buttons.map((button) => button.getAttribute("aria-controls"))).toEqual(panels.map((panel) => panel.id));
    expect(panels.map((panel) => panel.getAttribute("aria-labelledby"))).toEqual(buttons.map((button) => button.id));
    const ids = [...buttons, ...panels, ...other.buttons, ...other.panels].map((element) => element.id);
    expect(new Set(ids).size).toBe(8);
    expect(ids.every((id) => id !== "")).toBe(true);
  });

  it("starts on the first tab, with only its panel showing and only it in the tab order", () => {
    const { buttons, panels } = openTabs();
    expect(selectedOf(buttons)).toEqual(["true", "false"]);
    expect(buttons.map((button) => button.getAttribute("tabindex"))).toEqual(["0", "-1"]);
    expect(shownOf(panels)).toEqual([true, false]);
  });

  it("shows the panel of the tab that is pressed", () => {
    const { buttons, panels, tab } = openTabs();
    tab("Party").click();
    expect(selectedOf(buttons)).toEqual(["false", "true"]);
    expect(buttons.map((button) => button.getAttribute("tabindex"))).toEqual(["-1", "0"]);
    expect(shownOf(panels)).toEqual([false, true]);
  });

  it("selects a tab by its name from outside, without taking focus", () => {
    const { document, buttons, panels, tabs } = openTabs();
    tabs.select("Party");
    expect(selectedOf(buttons)).toEqual(["false", "true"]);
    expect(shownOf(panels)).toEqual([false, true]);
    expect(document.activeElement).toBe(document.body);
    tabs.select("Mine");
    expect(selectedOf(buttons)).toEqual(["true", "false"]);
  });

  it("moves to the other tab on an arrow, wrapping both ways, taking focus with it", () => {
    const { document, buttons, panels, press, tab } = openTabs();
    const event = press(tab("Mine"), "ArrowRight");
    expect(event.defaultPrevented).toBe(true);
    expect(selectedOf(buttons)).toEqual(["false", "true"]);
    expect(document.activeElement).toBe(tab("Party"));
    press(tab("Party"), "ArrowRight");
    expect(selectedOf(buttons)).toEqual(["true", "false"]);
    expect(document.activeElement).toBe(tab("Mine"));
    press(tab("Mine"), "ArrowLeft");
    expect(selectedOf(buttons)).toEqual(["false", "true"]);
    press(tab("Party"), "ArrowLeft");
    expect(selectedOf(buttons)).toEqual(["true", "false"]);
    expect(shownOf(panels)).toEqual([true, false]);
  });

  it("goes to the first tab on Home and to the last on End", () => {
    const { buttons, press, tab } = openTabs();
    press(tab("Mine"), "End");
    expect(selectedOf(buttons)).toEqual(["false", "true"]);
    press(tab("Party"), "Home");
    expect(selectedOf(buttons)).toEqual(["true", "false"]);
  });

  it("leaves other keys alone", () => {
    const { buttons, press, tab } = openTabs();
    const event = press(tab("Mine"), "a");
    expect(event.defaultPrevented).toBe(false);
    expect(selectedOf(buttons)).toEqual(["true", "false"]);
  });

  it("stops answering keys and presses once unloaded", () => {
    const { tabs, buttons, press, tab } = openTabs();
    tabs.unload();
    press(tab("Mine"), "ArrowRight");
    tab("Party").click();
    expect(selectedOf(buttons)).toEqual(["true", "false"]);
  });
});
