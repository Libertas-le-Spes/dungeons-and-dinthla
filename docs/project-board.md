# Project board

[Dungeons & Dinthla Backlog](https://github.com/orgs/Libertas-le-Spes/projects/1) is set up so that the cards anyone moves by hand are tasks, and stories while their tasks are under way. Labels, closing parents and the Done lane look after themselves.

The board started as a copy of the board of Nova Invest, another project of ours, so it has the same lanes, views and automations.

## Issues

| Kind | Title | What it is |
|---|---|---|
| Epic | `[EPIC] Questions` | Groups the stories of one part of the plugin |
| Story | `[STORY] As a player, I can …` | Something a player, DM, developer or the team can do once it's built, with a **Done when** list |
| Task | `[TASK] Questions view: …` | One piece of work, one pull request |

Tasks are sub-issues of their story, and stories of their epic. Two kinds of label sort them further:

- **Stage** (`stage 1: setup` to `stage 5: campaign home`): the order the plugin is built in. Each stage leaves something a player can use. Stories and tasks have one; epics span stages, so they don't.
- **Feature** (`feature: questions`, `feature: funds`, …): the part of the plugin it belongs to. Every issue has one.

## Why the board is set up this way

| What | Why |
|---|---|
| Epics are hidden in every view (`-label:epic`) | Work happens on stories and tasks; epics only group them |
| Issues closed as *not planned* are hidden (`-reason:"not planned"`) | Dropped work shouldn't look like finished work under Done |
| Every issue is labelled `epic`, `story` or `task` from its title prefix | The views filter on these. `.github/workflows/label-issues.yml` adds the label to new and edited issues, and swaps it when the prefix changes |
| Cards are ordered top to bottom in the order to work on them | The order is the priority. Pick from the top. The Priority field isn't used; ignore the empty Priority groups in **Next iteration** |
| **Story focus** view: tasks only, across the lanes | Choose **Group by → Parent issue** in the view menu for one row per story. GitHub keeps that for you only, unless you save the view |
| A story closes when its last task closes, an epic when its last story does | `.github/workflows/close-parent-issues.yml`, so nobody closes parents by hand |
| A task's pull request starts with `Closes #<task>` | Merging it closes the task, and the board's *Item closed* automation moves the card to Done |

## The board's automations

These are GitHub's built-in project workflows, all turned on. Each one's target lane is set on the board's **Workflows** page.

| Automation | What it does |
|---|---|
| *Item added to project* | Puts a new card in a starting lane |
| *Auto-add sub-issues to project* | Adds a new sub-issue when its parent is already on the board. A new epic, or anything without a parent, is added by hand |
| *Pull request linked to issue* | Moves a task when a pull request that closes it is opened |
| *Item closed* | Moves a closed issue to Done |
| *Pull request merged* | Moves merged pull requests to Done; the board holds issues, so it rarely matters here |
| *Auto-close issue* | **Closes an issue whose card is moved to Done.** Don't drag a card to Done by hand: a task would close without its pull request, and a story would close with tasks still open |

## Lanes

| Lane | A task is here when | A story is here when |
|---|---|---|
| Backlog | It is written, not started | None of its tasks is started |
| Ready | Everything it depends on is merged or in review | Its first task is Ready |
| In progress | It is being built on a branch | Any of its tasks is started, until the last one closes |
| In review | Its pull request is open | Never: a story waits in In progress |
| Done | Its pull request is merged | Its last task closed (the workflow above closes it) |

## Iterations

The board keeps Nova Invest's **Current iteration** and **Next iteration** views, but there is no current or upcoming iteration, so both are empty, and so is **Roadmap** until items have dates. Add iterations in the **Iteration** field's settings to use them.
