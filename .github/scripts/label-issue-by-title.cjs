const KINDS = ["epic", "story", "task"];
const KIND_FROM_TITLE = /^\[(EPIC|STORY|TASK)\]/;

function kindOf(title) {
  const match = title.match(KIND_FROM_TITLE);
  if (match === null) return null;
  return match[1].toLowerCase();
}

module.exports = async function labelIssueByTitle({ github, context }) {
  const { title, labels } = context.payload.issue;
  const kind = kindOf(title);
  const labelNames = labels.map((label) => label.name);
  const issue = { ...context.repo, issue_number: context.issue.number };

  for (const staleKind of KINDS.filter((other) => other !== kind && labelNames.includes(other))) {
    await github.rest.issues.removeLabel({ ...issue, name: staleKind });
  }
  if (kind === null || labelNames.includes(kind)) return;
  await github.rest.issues.addLabels({ ...issue, labels: [kind] });
};
