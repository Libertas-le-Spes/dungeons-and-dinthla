const KINDS = ["epic", "story", "task"];
const KIND_FROM_TITLE = /^\[(EPIC|STORY|TASK)\]/;

function kindOf(title) {
  const match = title.match(KIND_FROM_TITLE);
  if (match === null) return null;
  return match[1].toLowerCase();
}

const NOT_FOUND = 404;

async function currentIssue(github, issue) {
  const { data } = await github.rest.issues.get(issue);
  return { title: data.title, labelNames: data.labels.map((label) => label.name) };
}

async function removeLabelIfPresent(github, issue, name) {
  try {
    await github.rest.issues.removeLabel({ ...issue, name });
  } catch (error) {
    if (error.status !== NOT_FOUND) throw error;
  }
}

module.exports = async function labelIssueByTitle({ github, context }) {
  const issue = { ...context.repo, issue_number: context.issue.number };
  const { title, labelNames } = await currentIssue(github, issue);
  const kind = kindOf(title);

  for (const staleKind of KINDS.filter((other) => other !== kind && labelNames.includes(other))) {
    await removeLabelIfPresent(github, issue, staleKind);
  }
  if (kind === null || labelNames.includes(kind)) return;
  await github.rest.issues.addLabels({ ...issue, labels: [kind] });
};
