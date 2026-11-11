import type { SourcedText } from "../../campaign/record/campaign";
import type { ThreadRecord } from "../../campaign/threads/thread-kind";
import type { FollowUpName } from "../../kinds/follow-up-name";
import { questionShownKind } from "../../questions/list/question-shown-kind";
import { questShownKind } from "../../quests/list/quest-shown-kind";
import type { ShownThreadKind } from "./shown-thread-kind";

export const SHOWN_THREAD_KINDS: ShownThreadKind<ThreadRecord, SourcedText, FollowUpName>[] = [questionShownKind, questShownKind];
