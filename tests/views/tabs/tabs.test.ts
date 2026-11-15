import { describe, expect, it } from "vitest";
import { Tabs } from "../../../src/views/tabs/tabs";
import { obsidianDocument } from "../../stubs/obsidian-dom";

function openTabs() {
  const document = obsidianDocument();
  const parent = document.createElement("div");
  document.body.append(parent);
  const filled: string[] = [];
  const tabs = new Tabs({
    parent,
    label: "Funds",
    tabs: [
      { name: "Mine", fill: (panel) => filled.push(`Mine:${panel.getAttribute("role")}`) },
      { name: "Party", fill: (panel) => filled.push(`Party:${panel.getAttribute("role")}`) },
      { name: "Gone", fill: () => filled.push("Gone") },
    ],
  });
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
  return { document, parent, tabs, buttons, panels, filled, press, tab };
}

function selectedOf(buttons: HTMLElement[]): string[] {
  return buttons.map((button) => String(button.getAttribute("aria-selected")));
}

function shownOf(panels: HTMLElement[]): boolean[] {
  return panels.map((panel) => panel.style.display !== "none");
}

describe("Tabs", () => {
  it("makes a labelled tab list, one tab for each name, and a panel for each, filled with what the caller gives", () => {
    const { parent, buttons, panels, filled } = openTabs();
    expect(parent.querySelector("[role=tablist]")?.getAttribute("aria-label")).toBe("Funds");
    expect(buttons.map((button) => button.textContent)).toEqual(["Mine", "Party", "Gone"]);
    expect(buttons.every((button) => button.tagName === "BUTTON")).toBe(true);
    expect(panels.map((panel) => panel.getAttribute("aria-label"))).toEqual(["Mine", "Party", "Gone"]);
    expect(filled).toEqual(["Mine:tabpanel", "Party:tabpanel", "Gone"]);
  });

  it("starts on the first tab, with only its panel showing and only it in the tab order", () => {
    const { buttons, panels } = openTabs();
    expect(selectedOf(buttons)).toEqual(["true", "false", "false"]);
    expect(buttons.map((button) => button.getAttribute("tabindex"))).toEqual(["0", "-1", "-1"]);
    expect(shownOf(panels)).toEqual([true, false, false]);
  });

  it("shows the panel of the tab that is pressed", () => {
    const { buttons, panels, tab } = openTabs();
    tab("Party").click();
    expect(selectedOf(buttons)).toEqual(["false", "true", "false"]);
    expect(buttons.map((button) => button.getAttribute("tabindex"))).toEqual(["-1", "0", "-1"]);
    expect(shownOf(panels)).toEqual([false, true, false]);
  });

  it("moves to the next tab on the right arrow, and from the last back to the first, taking focus with it", () => {
    const { document, buttons, panels, press, tab } = openTabs();
    const event = press(tab("Mine"), "ArrowRight");
    expect(event.defaultPrevented).toBe(true);
    expect(selectedOf(buttons)).toEqual(["false", "true", "false"]);
    expect(document.activeElement).toBe(tab("Party"));
    press(tab("Party"), "ArrowRight");
    press(tab("Gone"), "ArrowRight");
    expect(selectedOf(buttons)).toEqual(["true", "false", "false"]);
    expect(document.activeElement).toBe(tab("Mine"));
    expect(shownOf(panels)).toEqual([true, false, false]);
  });

  it("moves to the tab before on the left arrow, and from the first round to the last", () => {
    const { document, buttons, press, tab } = openTabs();
    press(tab("Mine"), "ArrowLeft");
    expect(selectedOf(buttons)).toEqual(["false", "false", "true"]);
    expect(document.activeElement).toBe(tab("Gone"));
    press(tab("Gone"), "ArrowLeft");
    expect(selectedOf(buttons)).toEqual(["false", "true", "false"]);
  });

  it("goes to the first tab on Home and to the last on End", () => {
    const { buttons, press, tab } = openTabs();
    press(tab("Mine"), "End");
    expect(selectedOf(buttons)).toEqual(["false", "false", "true"]);
    press(tab("Gone"), "Home");
    expect(selectedOf(buttons)).toEqual(["true", "false", "false"]);
  });

  it("leaves other keys alone", () => {
    const { buttons, press, tab } = openTabs();
    const event = press(tab("Mine"), "a");
    expect(event.defaultPrevented).toBe(false);
    expect(selectedOf(buttons)).toEqual(["true", "false", "false"]);
  });

  it("stops answering keys and presses once unloaded", () => {
    const { tabs, buttons, press, tab } = openTabs();
    tabs.unload();
    press(tab("Mine"), "ArrowRight");
    tab("Gone").click();
    expect(selectedOf(buttons)).toEqual(["true", "false", "false"]);
  });
});
