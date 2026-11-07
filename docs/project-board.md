# Project board

[Dungeons & Dinthla Backlog](https://github.com/orgs/Libertas-le-Spes/projects/1) is a copy of Nova Invest's board, set up so the only thing anyone does by hand is move **task** cards. Everything else follows.

## Issues

| Kind | Title | What it is |
|---|---|---|
| Epic | `[EPIC] Questions` | Groups the stories of one part of the plugin |
| Story | `[STORY] As a player, I can …` | Something a player, DM or developer can do once it's built, with a **Done when** list |
| Task | `[TASK] Questions view: …` | One piece of work, one pull request |

Tasks are sub-issues of their story, and stories of their epic. Two kinds of label sort them further:

- **Stage** (`stage 1: setup` to `stage 5: campaign home`): the order the plugin is built in. Each stage leaves something a player can use.
- **Feature** (`feature: questions`, `feature: funds`, …): the part of the plugin it belongs to.

## Why the board is set up this way

| What | Why |
|---|---|
| Epics are hidden in every view (`-label:epic`) | Work happens on stories and tasks; epics only group them |
| Issues closed as *not planned* are hidden (`-reason:"not planned"`) | Dropped work shouldn't look like finished work under Done |
| Every issue is labelled `epic`, `story` or `task` from its title prefix | The views filter on these. `.github/workflows/label-issues.yml` adds the label to new and edited issues |
| Cards are ordered top to bottom in the order to work on them | The order is the priority. Pick from the top; the Priority field isn't used |
| **Story focus** view: tasks only, across the lanes | Group it by **Parent issue** (view menu) for one row per story, and collapse the rest |
| A story closes when its last task closes, an epic when its last story does | `.github/workflows/close-parent-issues.yml`, so nobody closes parents by hand |
| A task's pull request starts with `Closes #<task>` | Merging it closes the task, and the board's *Pull request merged* and *Item closed* workflows move the card to Done |
| New sub-issues join the board on their own | The board's *Auto-add sub-issues to project* workflow |

## Lanes

| Lane | Means |
|---|---|
| Backlog | Written, not started |
| Ready | Next up: everything it depends on is merged or in review |
| In progress | Being built on a branch |
| In review | Its pull request is open |
| Done | Merged and closed |

Stories move with their tasks by hand: In progress when the first task starts, Done when the last task closes (which the workflow above does).

## Iterations

The board keeps Nova Invest's **Current iteration** and **Next iteration** views, but no iterations are set yet, so both are empty. Add iterations in the **Iteration** field's settings to use them.
