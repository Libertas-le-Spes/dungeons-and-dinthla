import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const labelIssueByTitle = createRequire(import.meta.url)("../../.github/scripts/label-issue-by-title.cjs");

async function labelChanges(title: string, labels: string[]): Promise<string[]> {
  const changes: string[] = [];
  const issues = {
    addLabels: async ({ labels: added }: { labels: string[] }) => {
      changes.push(...added.map((name) => `+${name}`));
    },
    removeLabel: async ({ name }: { name: string }) => {
      changes.push(`-${name}`);
    },
  };
  await labelIssueByTitle({
    github: { rest: { issues } },
    context: {
      repo: { owner: "libertas", repo: "dinthla" },
      issue: { number: 7 },
      payload: { issue: { title, labels: labels.map((name) => ({ name })) } },
    },
  });
  return changes;
}

describe("labelIssueByTitle", () => {
  it("labels an issue from its title prefix", async () => {
    expect(await labelChanges("[TASK] Find the caravan", [])).toEqual(["+task"]);
    expect(await labelChanges("[STORY] As a player", [])).toEqual(["+story"]);
    expect(await labelChanges("[EPIC] Quests", [])).toEqual(["+epic"]);
  });

  it("leaves an issue that already has its label alone", async () => {
    expect(await labelChanges("[EPIC] Quests", ["epic"])).toEqual([]);
  });

  it("swaps the label when the prefix changes, keeping other labels", async () => {
    expect(await labelChanges("[STORY] Retitled", ["task", "bug"])).toEqual(["-task", "+story"]);
  });

  it("takes the label off when the prefix is removed", async () => {
    expect(await labelChanges("No prefix any more", ["story"])).toEqual(["-story"]);
  });

  it("ignores an issue without a prefix", async () => {
    expect(await labelChanges("Typo in the README", ["bug"])).toEqual([]);
  });
});
