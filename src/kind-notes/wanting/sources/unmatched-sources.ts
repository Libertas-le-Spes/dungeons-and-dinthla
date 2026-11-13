import type { Campaign, Source } from "../../../campaign/record/campaign";
import { kindFollowsUpWith } from "../../../kinds/follow-ups";
import type { TrackedKind } from "../../../kinds/tracked-kind";
import { readFollowUp } from "../../../notes/reading/follow-up";

export function unmatchedSourcesOf(campaign: Campaign, kind: TrackedKind): Source[] {
  const sources: Source[] = [];
  for (const line of campaign.unmatched) {
    const followUp = readFollowUp(line.text);
    if (followUp !== null && kindFollowsUpWith(kind, followUp.kind)) sources.push(line.source);
  }
  return sources;
}
