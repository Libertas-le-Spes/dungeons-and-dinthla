const PARENT_QUERY = `query($owner: String!, $repo: String!, $number: Int!) {
  repository(owner: $owner, name: $repo) {
    issue(number: $number) {
      parent { number state subIssues(first: 100) { nodes { state stateReason } } }
    }
  }
}`;

async function parentOf({ github, context }, number) {
  const { repository } = await github.graphql(PARENT_QUERY, { ...context.repo, number });
  return repository.issue.parent;
}

function closeReason(children) {
  return children.every((child) => child.stateReason === "NOT_PLANNED") ? "not_planned" : "completed";
}

async function closeParentIfFinished({ github, context, core }, parent) {
  const children = parent.subIssues.nodes;
  if (parent.state === "CLOSED" || children.some((child) => child.state === "OPEN")) return false;
  const reason = closeReason(children);
  await github.rest.issues.update({
    ...context.repo,
    issue_number: parent.number,
    state: "closed",
    state_reason: reason,
  });
  core.info(`Closed #${parent.number} (${reason}): all ${children.length} sub-issues are closed.`);
  return true;
}

async function reopenParentIfClosed({ github, context, core }, parent, reopenedChild) {
  if (parent.state === "OPEN") return false;
  await github.rest.issues.update({ ...context.repo, issue_number: parent.number, state: "open" });
  core.info(`Reopened #${parent.number}: #${reopenedChild} was reopened.`);
  return true;
}

module.exports = async function closeOrReopenParents(actions) {
  const closing = actions.context.payload.action === "closed";
  let number = actions.context.issue.number;
  for (let parent = await parentOf(actions, number); parent; parent = await parentOf(actions, number)) {
    const changed = closing
      ? await closeParentIfFinished(actions, parent)
      : await reopenParentIfClosed(actions, parent, number);
    if (!changed) return;
    number = parent.number;
  }
};
