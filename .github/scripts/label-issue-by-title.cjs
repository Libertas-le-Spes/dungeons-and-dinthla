const KIND_FROM_TITLE = /^\[(EPIC|STORY|TASK)\]/;

module.exports = async function labelIssueByTitle({ github, context }) {
  const { title, labels } = context.payload.issue;
  const kind = title.match(KIND_FROM_TITLE)?.[1]?.toLowerCase();
  const alreadyLabelled = labels.some((label) => label.name === kind);
  if (!kind || alreadyLabelled) return;
  await github.rest.issues.addLabels({
    ...context.repo,
    issue_number: context.issue.number,
    labels: [kind],
  });
};
