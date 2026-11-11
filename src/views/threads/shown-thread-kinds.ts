import type { SourcedText } from "../../campaign/campaign";
import type { ThreadRecord } from "../../campaign/thread-kind";
import type { FollowUpName } from "../../kinds/follow-up-name";
import { questionShownKind } from "../../questions/question-shown-kind";
import { questShownKind } from "../../quests/quest-shown-kind";
import type { ShownThreadKind } from "./shown-thread-kind";

export const SHOWN_THREAD_KINDS: ShownThreadKind<ThreadRecord, SourcedText, FollowUpName>[] = [questionShownKind, questShownKind];
