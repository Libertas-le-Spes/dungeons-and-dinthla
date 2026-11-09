import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { Campaign } from "../../src/campaign/campaign";
import type { AppendWriter } from "../../src/session-notes/append-writer";
import { Drafts } from "../../src/session-notes/drafts";
import { WritingPanel } from "../../src/session-notes/writing-panel";
import { isShown, obsidianDocument } from "../views/obsidian-dom";

const PATH = "Pale Moon/Sessions/Session 12.md";
const EARLIER = "Pale Moon/Sessions/Session 11.md";

function campaignOf(lines: string[]): Campaign {
  return buildCampaign([{ path: EARLIER, number: 11, firstLine: 0, text: lines.join("\n") }]);
}

const CAMPAIGN = campaignOf([
  "? Who owns the Old Mill",
  "? Why does the Old Mill wheel turn at night",
  "? Who sent the letter",
  "! Find the caravan",
  "$ [[Mira]] Silvered lantern",
]);

interface Setup {
  draft?: string;
  campaign?: Campaign;
  save?: (path: string, draft: string) => Promise<string>;
  drafts?: Drafts;
  path?: string;
}

interface Waiting {
  resolve(left: string): void;
  reject(error: Error): void;
}

function waitingSave() {
  const waiting: Waiting[] = [];
  const save = () => new Promise<string>((resolve, reject) => waiting.push({ resolve, reject }));
  const finish = (left: string) => waiting.shift()!.resolve(left);
  const fail = (error: Error) => waiting.shift()!.reject(error);
  return { save, finish, fail };
}

function panelWith({ draft = "", campaign = CAMPAIGN, save = async () => "", drafts = new Drafts({}, () => {}), path = PATH }: Setup = {}) {
  const document = obsidianDocument();
  const root = document.createElement("div");
  document.body.append(root);
  if (draft !== "") drafts.keep(path, draft);
  const writer = { save: vi.fn(save) };
  const openers = { question: vi.fn(), quest: vi.fn(), item: vi.fn() };
  const panel = new WritingPanel(root, path, { drafts, writer: writer as unknown as AppendWriter, openers, campaign: () => campaign });
  const box = root.querySelector("textarea")!;
  const window = document.defaultView!;
  const type = (text: string) => {
    box.value = text;
    box.setSelectionRange(text.length, text.length);
    box.dispatchEvent(new window.Event("input"));
  };
  const press = (key: string, modifiers: KeyboardEventInit = {}) => {
    const event = new window.KeyboardEvent("keydown", { key, cancelable: true, bubbles: true, ...modifiers });
    box.dispatchEvent(event);
    box.dispatchEvent(new window.KeyboardEvent("keyup", { key, bubbles: true }));
    return event;
  };
  const saveButton = root.querySelector<HTMLButtonElement>(".dd-save")!;
  const lookups = root.querySelector<HTMLElement>(".dd-box-lookups")!;
  const options = () => Array.from(lookups.querySelectorAll("[role=option]")).map((row) => `${row.getAttribute("aria-selected")} ${row.textContent}`);
  const heading = () => lookups.querySelector(".dd-box-lookups-heading")?.textContent;
  return { root, panel, box, drafts, writer, openers, type, press, saveButton, lookups, options, heading };
}

describe("WritingPanel", () => {
  it("lays out the box as the prototype does", () => {
    const { root, box } = panelWith();
    expect(root.querySelector(".dd-box-label")?.firstChild?.textContent).toBe("Type a line starting with ? ! or $, and link names with [[ ]]");
    expect(box.getAttribute("placeholder")).toBe("! Find the caravan, from: [[Lady Vess]], reward: 200 gp");
    expect(box.getAttribute("spellcheck")).toBe("false");
    expect(root.querySelector(".dd-box-help")?.textContent).toBe(
      "To find and update an earlier note, start a line with ?? for a question, !! for a quest or $$ for an item, then a few words.",
    );
    expect(root.querySelector(".dd-save")?.textContent).toBe("Save");
    expect(root.querySelector(".dd-save-hint")?.textContent).toBe("Ctrl + Enter saves");
  });

  it("starts with the session's draft, and keeps what is typed as the draft", () => {
    const { box, type, drafts } = panelWith({ draft: "? Who" });
    expect(box.value).toBe("? Who");
    type("? Who\n! Ride to Thessaly");
    expect(drafts.textOf(PATH)).toBe("? Who\n! Ride to Thessaly");
    expect(drafts.textOf(EARLIER)).toBe("");
  });

  it("lets Save be pressed only when there is a line to save", () => {
    const { saveButton, type } = panelWith();
    expect(saveButton.disabled).toBe(true);
    type("?? letter\n  ");
    expect(saveButton.disabled).toBe(true);
    type("?? letter\nTracks lead north");
    expect(saveButton.disabled).toBe(false);
  });

  it("saves the box to the session, keeps only the lookups in it and goes back to the box", async () => {
    const { panel, saveButton, type, writer, box, drafts, root } = panelWith({ save: async () => "?? letter" });
    type("? Who\n?? letter");
    saveButton.click();
    await vi.waitFor(() => expect(box.value).toBe("?? letter"));
    expect(writer.save).toHaveBeenCalledExactlyOnceWith(PATH, "? Who\n?? letter");
    expect(drafts.textOf(PATH)).toBe("?? letter");
    expect(root.ownerDocument.activeElement).toBe(box);
    expect(saveButton.disabled).toBe(true);
    await panel.save();
    expect(writer.save).toHaveBeenCalledOnce();
  });

  it("saves with Ctrl + Enter and with Cmd + Enter, and not with Enter alone", async () => {
    const { press, type, writer } = panelWith();
    type("? Who");
    const plain = press("Enter");
    expect(plain.defaultPrevented).toBe(false);
    expect(writer.save).not.toHaveBeenCalled();
    const ctrl = press("Enter", { ctrlKey: true });
    expect(ctrl.defaultPrevented).toBe(true);
    await vi.waitFor(() => expect(writer.save).toHaveBeenCalledOnce());
    type("! Ride to Thessaly");
    press("Enter", { metaKey: true });
    await vi.waitFor(() => expect(writer.save).toHaveBeenCalledTimes(2));
    expect(writer.save).toHaveBeenLastCalledWith(PATH, "! Ride to Thessaly");
  });

  it("keeps the box and says why when the save fails", async () => {
    const save = async () => {
      throw new Error(`${PATH} was moved or deleted`);
    };
    const { saveButton, type, box, drafts, root } = panelWith({ save });
    type("? Who\n! Ride to Thessaly");
    saveButton.click();
    const message = root.querySelector(".dd-save-message")!;
    await vi.waitFor(() => expect(message.textContent).toBe(`Couldn't save: ${PATH} was moved or deleted. Your lines are still in the box.`));
    expect(box.value).toBe("? Who\n! Ride to Thessaly");
    expect(drafts.textOf(PATH)).toBe("? Who\n! Ride to Thessaly");
    expect(box.readOnly).toBe(false);
    expect(saveButton.disabled).toBe(false);
  });

  it("holds the box still while saving, and saves once however often Save is pressed", async () => {
    const { save, finish } = waitingSave();
    const { saveButton, type, box, writer, press } = panelWith({ save });
    type("? Who");
    saveButton.click();
    expect(box.readOnly).toBe(true);
    expect(saveButton.disabled).toBe(true);
    press("Enter", { ctrlKey: true });
    expect(writer.save).toHaveBeenCalledOnce();
    finish("");
    await vi.waitFor(() => expect(box.readOnly).toBe(false));
  });

  it("suggests open questions holding every word typed on a ?? line, newest first, with the words marked", () => {
    const { type, options, heading, lookups } = panelWith();
    expect(isShown(lookups)).toBe(false);
    type("Tracks lead north\n?? old mill");
    expect(isShown(lookups)).toBe(true);
    expect(heading()).toBe("Pick the question to answer");
    expect(options()).toEqual(["true ?Why does the Old Mill wheel turn at night", "false ?Who owns the Old Mill"]);
    expect(Array.from(lookups.querySelectorAll("mark")).map((mark) => mark.textContent)).toEqual(["Old", "Mill", "Old", "Mill"]);
  });

  it("suggests active quests on a !! line and held items with their holder on a $$ line", () => {
    const { type, options, heading } = panelWith();
    type("!! caravan");
    expect(heading()).toBe("Pick the quest to update");
    expect(options()).toEqual(["true !Find the caravan"]);
    type("$$ lantern");
    expect(heading()).toBe("Pick the item to update");
    expect(options()).toEqual(["true $Silvered lanternMira"]);
  });

  it("shows at most eight suggestions", () => {
    const many = Array.from({ length: 10 }, (_unused, index) => `? Clue ${index}`);
    const { type, options } = panelWith({ campaign: campaignOf(many) });
    type("?? clue");
    expect(options()).toHaveLength(8);
    expect(options()[0]).toBe("true ?Clue 9");
  });

  it("says when nothing matches the words, or nothing is open", () => {
    const { type, heading, options } = panelWith();
    type("?? thessaly");
    expect(heading()).toBe("No open question matches “thessaly”");
    expect(options()).toEqual([]);
    const empty = panelWith({ campaign: campaignOf([]) });
    empty.type("!! ");
    expect(empty.heading()).toBe("No active quests");
  });

  it("follows the line the caret is on, and closes off a lookup line", () => {
    const { type, box, lookups } = panelWith();
    type("?? mill\nTracks lead north");
    expect(isShown(lookups)).toBe(false);
    box.setSelectionRange(3, 3);
    box.dispatchEvent(new box.ownerDocument.defaultView!.MouseEvent("click"));
    expect(isShown(lookups)).toBe(true);
  });

  it("moves through the suggestions with the arrows, wrapping at both ends", () => {
    const { type, press, options } = panelWith();
    type("?? who");
    expect(options().map((option) => option.startsWith("true"))).toEqual([true, false]);
    expect(press("ArrowDown").defaultPrevented).toBe(true);
    expect(options().map((option) => option.startsWith("true"))).toEqual([false, true]);
    press("ArrowDown");
    expect(options().map((option) => option.startsWith("true"))).toEqual([true, false]);
    press("ArrowUp");
    expect(options().map((option) => option.startsWith("true"))).toEqual([false, true]);
  });

  it("closes the suggestions with Esc until the line changes", () => {
    const { type, press, lookups } = panelWith();
    type("?? who");
    const escape = press("Escape");
    expect(escape.defaultPrevented).toBe(true);
    expect(isShown(lookups)).toBe(false);
    type("?? who sent");
    expect(isShown(lookups)).toBe(true);
  });

  it("picks the chosen suggestion with Enter: the lookup line leaves the box and the dialog opens, coming back to the box", () => {
    const { type, press, openers, box, drafts, lookups, root } = panelWith();
    type("? Why\n?? who\nTracks");
    box.setSelectionRange(9, 9);
    box.dispatchEvent(new box.ownerDocument.defaultView!.Event("input"));
    press("ArrowDown");
    const enter = press("Enter");
    expect(enter.defaultPrevented).toBe(true);
    expect(box.value).toBe("? Why\nTracks");
    expect(drafts.textOf(PATH)).toBe("? Why\nTracks");
    expect(isShown(lookups)).toBe(false);
    expect(openers.question).toHaveBeenCalledExactlyOnceWith({ path: EARLIER, line: 0 }, expect.any(Function));
    const [, onClosed] = openers.question.mock.lastCall!;
    box.blur();
    onClosed();
    expect(root.ownerDocument.activeElement).toBe(box);
  });

  it("picks a suggestion when it is clicked", () => {
    const { type, openers, lookups, box } = panelWith();
    type("$$ lantern");
    lookups.querySelector<HTMLElement>("[role=option]")!.click();
    expect(openers.item).toHaveBeenCalledExactlyOnceWith("Silvered lantern", { path: EARLIER, line: 4 }, expect.any(Function));
    expect(box.value).toBe("");
  });

  it("leaves Enter and the arrows to the box when no suggestions show", () => {
    const { type, press } = panelWith();
    type("Tracks lead north");
    expect(press("Enter").defaultPrevented).toBe(false);
    expect(press("ArrowUp").defaultPrevented).toBe(false);
    expect(press("ArrowDown").defaultPrevented).toBe(false);
  });

  it("leaves Enter to the box once Esc has closed the suggestions", () => {
    const { type, press } = panelWith();
    type("?? who");
    press("Escape");
    expect(press("Enter").defaultPrevented).toBe(false);
  });

  it("keeps Esc from reaching the page when it closes the suggestions", () => {
    const { type, press, root } = panelWith();
    const pageKeys = vi.fn();
    root.addEventListener("keydown", pageKeys);
    type("?? who");
    press("Escape");
    expect(pageKeys).not.toHaveBeenCalled();
  });

  it("closes the suggestions when the box loses focus", () => {
    const { type, box, lookups } = panelWith();
    type("?? who");
    box.dispatchEvent(new box.ownerDocument.defaultView!.FocusEvent("blur"));
    expect(isShown(lookups)).toBe(false);
  });

  it("keeps the focus in the box when a suggestion is pressed", () => {
    const { type, lookups, box } = panelWith();
    type("?? who");
    const press = new box.ownerDocument.defaultView!.MouseEvent("mousedown", { cancelable: true, bubbles: true });
    lookups.querySelector("[role=option]")!.dispatchEvent(press);
    expect(press.defaultPrevented).toBe(true);
  });

  it("closes the suggestions when saving, and opens none while the save runs", async () => {
    const { save, finish } = waitingSave();
    const { type, press, lookups, box } = panelWith({ save });
    type("? Why\n?? who");
    expect(isShown(lookups)).toBe(true);
    press("Enter", { ctrlKey: true });
    expect(isShown(lookups)).toBe(false);
    box.dispatchEvent(new box.ownerDocument.defaultView!.MouseEvent("click"));
    expect(isShown(lookups)).toBe(false);
    finish("?? who");
    await vi.waitFor(() => expect(box.readOnly).toBe(false));
  });

  it("clears the message about a failed save once a save goes through", async () => {
    const { save, finish, fail } = waitingSave();
    const { saveButton, type, root, box } = panelWith({ save });
    const message = root.querySelector(".dd-save-message")!;
    type("? Who");
    saveButton.click();
    fail(new Error(`${PATH} was moved or deleted`));
    await vi.waitFor(() => expect(message.textContent).not.toBe(""));
    saveButton.click();
    finish("");
    await vi.waitFor(() => expect(box.value).toBe(""));
    expect(message.textContent).toBe("");
  });

  it("holds every box of the session still while one saves, then shows them what is left, saving once", async () => {
    const drafts = new Drafts({}, () => {});
    const { save, finish } = waitingSave();
    const first = panelWith({ drafts, save });
    first.type("? Who\n?? letter");
    first.saveButton.click();
    const second = panelWith({ drafts, save });
    expect(second.box.value).toBe("? Who\n?? letter");
    expect(second.box.readOnly).toBe(true);
    await second.panel.save();
    expect(second.writer.save).not.toHaveBeenCalled();
    finish("?? letter");
    await vi.waitFor(() => expect(second.box.value).toBe("?? letter"));
    expect(second.box.readOnly).toBe(false);
    expect(first.box.value).toBe("?? letter");
    expect(drafts.textOf(PATH)).toBe("?? letter");
    expect(first.writer.save).toHaveBeenCalledOnce();
  });

  it("keeps what is left of a save under the session's new name when it is renamed while saving", async () => {
    const drafts = new Drafts({}, () => {});
    const { save, finish } = waitingSave();
    const renamed = "Pale Moon/Sessions/Session 13.md";
    const first = panelWith({ drafts, save });
    first.type("? Who\n?? letter");
    first.saveButton.click();
    drafts.moved(PATH, renamed);
    const second = panelWith({ drafts, save, path: renamed });
    expect(second.box.readOnly).toBe(true);
    finish("?? letter");
    await vi.waitFor(() => expect(second.box.value).toBe("?? letter"));
    expect(drafts.textOf(renamed)).toBe("?? letter");
    expect(drafts.textOf(PATH)).toBe("");
    expect(first.writer.save).toHaveBeenCalledExactlyOnceWith(PATH, "? Who\n?? letter");
  });

  it("stops following the session's saves once closed", async () => {
    const drafts = new Drafts({}, () => {});
    const { save, finish } = waitingSave();
    const closed = panelWith({ drafts, draft: "? Who" });
    closed.panel.close();
    const open = panelWith({ drafts, save });
    open.saveButton.click();
    expect(closed.box.readOnly).toBe(false);
    finish("");
    await vi.waitFor(() => expect(open.box.value).toBe(""));
    expect(closed.box.value).toBe("? Who");
  });
});
