import { describe, expect, it, vi } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import type { SessionNote } from "../../src/campaign/campaign";
import type { CampaignListener } from "../../src/campaign/campaign-store";
import type { WelcomeActions } from "../../src/welcome/welcome-ending";
import { WelcomePage, type WelcomeStore } from "../../src/welcome/welcome-page";
import { obsidianDocument } from "../views/obsidian-dom";

const CAMPAIGN = "Silver Road";

function sessionNote(): SessionNote {
  return { path: `${CAMPAIGN}/Sessions/Session 1.md`, number: 1, firstLine: 0, text: "" };
}

function welcomeFor(campaignFolder: string | null, sessionNotes: SessionNote[]) {
  let listener: CampaignListener = () => {};
  const unsubscribe = vi.fn();
  const store: WelcomeStore = {
    campaignFolder,
    sessionNotes,
    subscribe: (next) => {
      listener = next;
      return unsubscribe;
    },
  };
  let finishMaking = () => {};
  const actions = {
    startSession: vi.fn(),
    showCampaign: vi.fn(),
    makeCampaign: vi.fn(
      (_name: string) =>
        new Promise<void>((resolve) => {
          finishMaking = resolve;
        }),
    ),
  } satisfies WelcomeActions;
  const root = obsidianDocument().body.createDiv();
  const page = new WelcomePage(root, store, actions);
  page.load();
  const change = (folder: string | null, notes: SessionNote[]) => {
    Object.assign(store, { campaignFolder: folder, sessionNotes: notes });
    listener(buildCampaign(notes));
  };
  return { root, page, actions, change, unsubscribe, finishMaking: () => finishMaking() };
}

function buttonTexts(root: HTMLElement): string[] {
  return [...root.querySelectorAll("button")].map((button) => String(button.textContent));
}

function buttonNamed(root: HTMLElement, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll("button")].find((each) => each.textContent === text);
  if (button === undefined) throw new Error(`No button ${text}`);
  return button;
}

function submit(root: HTMLElement, name: string): void {
  root.querySelector("input")!.value = name;
  const form = root.querySelector("form")!;
  form.dispatchEvent(new form.ownerDocument.defaultView!.Event("submit", { cancelable: true }));
}

function settled(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("WelcomePage", () => {
  it("shows the three first steps under a welcome heading", () => {
    const { root } = welcomeFor(CAMPAIGN, []);
    expect(root.querySelector("h2")!.textContent).toBe("Welcome to Dungeons & Dinthla");
    expect([...root.querySelectorAll("ol li")].map((step) => step.textContent)).toEqual([
      "Your campaign lives in this tab. Use the sidebar (or the bar at the bottom on a phone) to move around.",
      "Start a session with New session and type your notes; start a line with ? for a question, ! for a quest, $ for coin or an item.",
      "Opening any note in your campaign brings you back here.",
    ]);
  });

  it("offers to start the first session when the campaign has none", () => {
    const { root, actions } = welcomeFor(CAMPAIGN, []);
    expect(buttonTexts(root)).toEqual(["Start my first session"]);
    buttonNamed(root, "Start my first session").click();
    expect(actions.startSession).toHaveBeenCalledOnce();
  });

  it("offers to go to the campaign when it has sessions", () => {
    const { root, actions } = welcomeFor(CAMPAIGN, [sessionNote()]);
    expect(buttonTexts(root)).toEqual(["Go to my campaign"]);
    buttonNamed(root, "Go to my campaign").click();
    expect(actions.showCampaign).toHaveBeenCalledOnce();
  });

  it("explains how to make a campaign and offers to make one when there is none", () => {
    const { root } = welcomeFor(null, []);
    expect(root.querySelector(".dd-welcome-how")!.textContent).toContain("a folder at the top of your vault holding a note with the same name");
    expect(root.querySelector("input")!.getAttribute("aria-label")).toBe("Campaign name");
    expect(buttonTexts(root)).toEqual(["Make a campaign"]);
  });

  it("makes a campaign with the typed name, the button held until it is made", async () => {
    const { root, actions, finishMaking } = welcomeFor(null, []);
    submit(root, "Silver Road");
    expect(actions.makeCampaign).toHaveBeenCalledExactlyOnceWith("Silver Road");
    expect(buttonNamed(root, "Make a campaign").disabled).toBe(true);
    finishMaking();
    await settled();
    expect(buttonNamed(root, "Make a campaign").disabled).toBe(false);
  });

  it("moves on to the first session once the campaign is made", () => {
    const { root, change } = welcomeFor(null, []);
    change(CAMPAIGN, []);
    expect(buttonTexts(root)).toEqual(["Start my first session"]);
  });

  it("keeps what is typed in the name box when the campaign changes without one being made", () => {
    const { root, change } = welcomeFor(null, []);
    root.querySelector("input")!.value = "Silver";
    change(null, []);
    expect(root.querySelector("input")!.value).toBe("Silver");
  });

  it("stops following the campaign when it is closed", () => {
    const { page, unsubscribe } = welcomeFor(CAMPAIGN, []);
    page.unload();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
