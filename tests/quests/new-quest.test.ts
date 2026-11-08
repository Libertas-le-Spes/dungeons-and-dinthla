import { describe, expect, it } from "vitest";
import { buildCampaign } from "../../src/campaign/build-campaign";
import { planNewQuest, refusalForNewQuest, SAME_TITLE_AS_EXISTING, WOULD_READ_DIFFERENTLY } from "../../src/quests/new-quest";

const quests = buildCampaign([{ path: "S/Sessions/Session 1.md", number: 1, firstLine: 0, text: "! Find the caravan" }]).quests;

describe("planNewQuest", () => {
  it("writes the title, who gave it and the reward as one quest line", () => {
    expect(planNewQuest({ title: " ! Escort Mira ", givenBy: "", reward: " 50 gp " }, []).line).toBe("! Escort Mira, reward: 50 gp");
    expect(planNewQuest({ title: "Guard it", givenBy: "", reward: "" }, []).line).toBe("! Guard it");
  });

  it("links a giver who has a character note, whatever their capitals", () => {
    expect(planNewQuest({ title: "Guard it", givenBy: "lady vess", reward: "" }, ["Lady Vess"]).line).toBe("! Guard it, from: [[Lady Vess]]");
  });

  it("leaves a giver without a note, or already linked, as typed", () => {
    expect(planNewQuest({ title: "Guard it", givenBy: "the innkeeper", reward: "" }, ["Lady Vess"]).line).toBe("! Guard it, from: the innkeeper");
    expect(planNewQuest({ title: "Guard it", givenBy: "[[Mira]]", reward: "" }, []).line).toBe("! Guard it, from: [[Mira]]");
  });
});

describe("refusalForNewQuest", () => {
  function refusal(title: string, givenBy = "", reward = ""): string | null {
    return refusalForNewQuest(quests, planNewQuest({ title, givenBy, reward }, []));
  }

  it("lets an ordinary new quest through", () => {
    expect(refusal("Escort Mira", "Lady Vess", "50 gp")).toBeNull();
  });

  it("refuses a quest with a title already used", () => {
    expect(refusal("Find the caravan")).toBe(SAME_TITLE_AS_EXISTING);
  });

  it("refuses a quest that would read back differently", () => {
    expect(refusal("Find it, reward: 5 gp")).toBe(WOULD_READ_DIFFERENTLY);
    expect(refusal("Find it", "", "5 gp, from: Vess")).toBe(WOULD_READ_DIFFERENTLY);
  });
});
