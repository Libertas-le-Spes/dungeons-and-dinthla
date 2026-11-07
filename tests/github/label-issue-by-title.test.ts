import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const labelIssueByTitle = createRequire(import.meta.url)("../../.github/scripts/label-issue-by-title.cjs");

interface Issue {
  title: string;
  labels: string[];
}

interface Run {
  changes: string[];
  fetched: unknown[];
}

function notFound(): Error {
  return Object.assign(new Error("Label does not exist"), { status: 404 });
}

async function runOn(current: Issue, event: Issue, removeFailure?: Error): Promise<Run> {
  const run: Run = { changes: [], fetched: [] };
  const issues = {
    get: async (asked: unknown) => {
      run.fetched.push(asked);
      return { data: { title: current.title, labels: current.labels.map((name) => ({ name })) } };
    },
    addLabels: async ({ labels: added }: { labels: string[] }) => {
      run.changes.push(...added.map((name) => `+${name}`));
    },
    removeLabel: async ({ name }: { name: string }) => {
      if (removeFailure !== undefined) throw removeFailure;
      if (!current.labels.includes(name)) throw notFound();
      run.changes.push(`-${name}`);
    },
  };
  await labelIssueByTitle({
    github: { rest: { issues } },
    context: {
      repo: { owner: "libertas", repo: "dinthla" },
      issue: { number: 7 },
      payload: { issue: { title: event.title, labels: event.labels.map((name) => ({ name })) } },
    },
  });
  return run;
}

async function labelChanges(title: string, labels: string[]): Promise<string[]> {
  const issue = { title, labels };
  const run = await runOn(issue, issue);
  return run.changes;
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

  it("reads the issue as it is now, once", async () => {
    const issue = { title: "[TASK] Find the caravan", labels: [] };
    const run = await runOn(issue, issue);
    expect(run.fetched).toEqual([{ owner: "libertas", repo: "dinthla", issue_number: 7 }]);
  });

  it("works from the labels the issue has now when the event's are out of date", async () => {
    const now = { title: "[EPIC] Quests", labels: ["story"] };
    const stale = { title: "[EPIC] Quests", labels: ["task"] };
    const run = await runOn(now, stale);
    expect(run.changes).toEqual(["-story", "+epic"]);
  });

  it("works from the title the issue has now when the event's is out of date", async () => {
    const now = { title: "[EPIC] Quests", labels: ["story"] };
    const stale = { title: "[STORY] Quests", labels: ["story"] };
    const run = await runOn(now, stale);
    expect(run.changes).toEqual(["-story", "+epic"]);
  });

  it("carries on when a label it removes is already gone", async () => {
    const issue = { title: "[EPIC] Quests", labels: ["story"] };
    const run = await runOn(issue, issue, notFound());
    expect(run.changes).toEqual(["+epic"]);
  });

  it("fails on any other error removing a label", async () => {
    const issue = { title: "[EPIC] Quests", labels: ["story"] };
    const forbidden = Object.assign(new Error("Forbidden"), { status: 403 });
    await expect(runOn(issue, issue, forbidden)).rejects.toBe(forbidden);
  });
});
