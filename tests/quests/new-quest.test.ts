import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { planNewQuest, refusalForNewQuest, SAME_TITLE_AS_EXISTING, WOULD_READ_DIFFERENTLY } from "../../src/quests/new-quest";

const quests = buildCampaign([
  { path: "S/Sessions/Session 1.md", number: 1, firstLine: 0, text: "! Find the caravan\n! Guard the bridge\n!= Guard the bridge: done" },
]).quests;
const MIRA = { name: "Mira", linktext: "Mira" };
const VESS = { name: "Lady Vess", linktext: "Curse/Characters/Lady Vess" };

describe("planNewQuest", () => {
  it("writes the title, who gave it and the reward as one quest line", () => {
    expect(planNewQuest({ title: " ! Escort Mira ", givenBy: "the innkeeper", reward: " 50 gp " }, []).line).toBe(
      "! Escort Mira, from: the innkeeper, reward: 50 gp",
    );
    expect(planNewQuest({ title: "Guard it", givenBy: "", reward: "" }, []).line).toBe("! Guard it");
  });

  it("links a giver who has a character note, whatever their capitals", () => {
    expect(planNewQuest({ title: "Guard it", givenBy: "mira", reward: "" }, [MIRA]).line).toBe("! Guard it, from: [[Mira]]");
  });

  it("links by the full path when another note shares the character's name", () => {
    expect(planNewQuest({ title: "Guard it", givenBy: "Lady Vess", reward: "" }, [VESS]).line).toBe(
      "! Guard it, from: [[Curse/Characters/Lady Vess|Lady Vess]]",
    );
  });

  it("writes a giver without a note as typed", () => {
    expect(planNewQuest({ title: "Guard it", givenBy: "[[Mira]]", reward: "" }, []).line).toBe("! Guard it, from: [[Mira]]");
  });
});

describe("refusalForNewQuest", () => {
  function refusal(title: string, givenBy = "", reward = ""): string | null {
    return refusalForNewQuest(quests, planNewQuest({ title, givenBy, reward }, [MIRA, VESS]));
  }

  it("lets ordinary new quests through, linked givers included", () => {
    expect(refusal("Escort Mira", "the innkeeper", "50 gp")).toBeNull();
    expect(refusal("Escort Mira", "Lady Vess", "50 gp")).toBeNull();
  });

  it("refuses a title already used by an open or a finished quest", () => {
    expect(refusal("Find the caravan")).toBe(SAME_TITLE_AS_EXISTING);
    expect(refusal("Guard the bridge")).toBe(SAME_TITLE_AS_EXISTING);
  });

  it("refuses a title that would read back shorter", () => {
    expect(refusal("Find it,")).toBe(WOULD_READ_DIFFERENTLY);
  });

  it("refuses a giver that would read back as someone else", () => {
    expect(refusal("Find it", "Lady from: x")).toBe(WOULD_READ_DIFFERENTLY);
  });

  it("refuses a reward that would read back as something else", () => {
    expect(refusal("Find it", "", "5 gp,")).toBe(WOULD_READ_DIFFERENTLY);
  });
});
