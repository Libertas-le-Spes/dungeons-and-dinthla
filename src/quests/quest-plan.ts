import { applySessionChange } from "../campaign/apply-session-change";
import { buildCampaign } from "../campaign/build-campaign";
import type { Campaign, CoinRecord, QuestRecord, QuestStatus, SessionNote } from "../campaign/campaign";
import type { Removal } from "../campaign/note-editor";
import { questThreadKind } from "../campaign/quest-thread-kind";
import { endingRemoval } from "../campaign/thread-removal";
import { readLedgerEntry } from "../notes/ledger";
import { followUpQuestLine, isCoinReward, outcomeLine, progressLine, questTextOf, rewardLine } from "../notes/quest-lines";
import { readMarker } from "../notes/marker";
import { readQuest } from "../notes/quest";
import { oneLine } from "../notes/one-line";
import { questSessionChange } from "./quest-session-change";

export type QuestStatusChoice = "active" | QuestStatus;

export interface QuestEdit {
  status: QuestStatusChoice;
  happened: string;
  collectReward: boolean;
  followUp: string;
}

interface ExpectedQuest {
  progress: string[];
  outcome: string | null;
}

export interface QuestPlan {
  targetPath: string;
  added: string[];
  removal: Removal | null;
  expected: ExpectedQuest;
  rewardCopper: number;
  followUpTitle: string | null;
}

export const CHANGES_ANOTHER_QUEST =
  "That change wouldn't be read as asked, or would change another quest or the purse beyond the reward, so nothing was written.";

function outcomeKey(status: QuestStatus, text: string, path: string): string {
  return JSON.stringify([status, oneLine(text), path]);
}

function placed(path: string, text: string): string {
  return JSON.stringify([path, oneLine(text)]);
}

function rewardCopperOf(reward: string, title: string): number | null {
  const own = readLedgerEntry(reward);
  const written = readLedgerEntry(readMarker(rewardLine(reward, title)).body);
  if (own === null || written === null || own.type !== "coin" || written.type !== "coin") return null;
  if (own.coins.length !== 1 || own.copper !== written.copper) return null;
  return own.copper;
}

interface RewardToCollect {
  line: string;
  copper: number;
}

function rewardToCollect(record: QuestRecord, coins: CoinRecord[]): RewardToCollect | null {
  const reward = record.quest.reward;
  if (reward === undefined || !isCoinReward(reward)) return null;
  const copper = rewardCopperOf(reward, record.quest.title);
  if (copper === null) return null;
  const collected = coins.some((coin) => coin.text.endsWith(`, for: ${record.quest.title}`));
  if (collected) return null;
  return { line: rewardLine(reward, record.quest.title), copper };
}

export function canCollectReward(record: QuestRecord, coins: CoinRecord[]): boolean {
  return rewardToCollect(record, coins) !== null;
}

export function outcomeRemoval(record: QuestRecord): Removal | null {
  return endingRemoval(questThreadKind, record);
}

export function initialQuestEdit(record: QuestRecord): QuestEdit {
  if (record.outcome === null) return { status: "active", happened: "", collectReward: true, followUp: "" };
  return { status: record.outcome.status, happened: record.outcome.text, collectReward: false, followUp: "" };
}

export function planQuestSave(record: QuestRecord, edit: QuestEdit, coins: CoinRecord[], sessionPath: string): QuestPlan {
  let targetPath = sessionPath;
  const title = record.quest.title;
  const happened = oneLine(edit.happened);
  const added: string[] = [];
  const progress = record.progress.map((note) => placed(note.source.path, note.text));
  let outcome: string | null = null;
  if (record.outcome !== null) outcome = outcomeKey(record.outcome.status, record.outcome.text, record.outcome.source.path);
  let removal: Removal | null = null;
  if (edit.status === "active") {
    removal = outcomeRemoval(record);
    outcome = null;
    if (happened !== "") {
      added.push(progressLine(title, happened));
      progress.push(placed(targetPath, happened));
    }
  } else if (record.outcome === null || record.outcome.status !== edit.status || oneLine(record.outcome.text) !== happened) {
    added.push(outcomeLine(edit.status, title, happened));
    removal = outcomeRemoval(record);
    if (record.outcome !== null) targetPath = record.outcome.source.path;
    outcome = outcomeKey(edit.status, happened, targetPath);
  }
  let rewardCopper = 0;
  if (edit.status === "completed" && edit.collectReward) {
    const reward = rewardToCollect(record, coins);
    if (reward !== null) {
      added.push(reward.line);
      rewardCopper = reward.copper;
    }
  }
  let followUpTitle: string | null = null;
  const followUp = questTextOf(edit.followUp);
  if (followUp !== "") {
    const line = followUpQuestLine(followUp, title);
    added.push(line);
    followUpTitle = readQuest(readMarker(line).body).title;
  }
  return { targetPath, added, removal, expected: { progress, outcome }, rewardCopper, followUpTitle };
}

function signatureOf(record: QuestRecord): string {
  let outcome = "";
  if (record.outcome !== null) outcome = outcomeKey(record.outcome.status, record.outcome.text, record.outcome.source.path);
  return JSON.stringify([record.source.path, record.quest.title, record.progress.map((note) => placed(note.source.path, note.text)), outcome]);
}

function expectedSignature(record: QuestRecord, expected: ExpectedQuest): string {
  let outcome = "";
  if (expected.outcome !== null) outcome = expected.outcome;
  return JSON.stringify([record.source.path, record.quest.title, expected.progress, outcome]);
}

function questsBesidesFollowUp(campaign: Campaign, plan: QuestPlan): QuestRecord[] {
  const quests = [...campaign.quests];
  if (plan.followUpTitle === null) return quests;
  const index = quests.findLastIndex((candidate) => candidate.source.path === plan.targetPath && candidate.quest.title === plan.followUpTitle);
  if (index !== -1) quests.splice(index, 1);
  return quests;
}

export function refusalForQuestPlan(sessions: SessionNote[], record: QuestRecord, plan: QuestPlan): string | null {
  if (!sessions.some((session) => session.path === plan.targetPath)) return CHANGES_ANOTHER_QUEST;
  const before = buildCampaign(sessions);
  const after = buildCampaign(applySessionChange(sessions, questSessionChange(plan)).sessions);
  const wanted = before.quests.map((quest) => {
    const isOpened = quest.source.path === record.source.path && quest.source.line === record.source.line;
    if (isOpened) return expectedSignature(record, plan.expected);
    return signatureOf(quest);
  });
  const found = questsBesidesFollowUp(after, plan).map(signatureOf);
  const followUpStartsFresh = after.quests.every(
    (quest) => quest.quest.title !== plan.followUpTitle || quest.source.path !== plan.targetPath || (quest.progress.length === 0 && quest.outcome === null),
  );
  const questsMatch = JSON.stringify(wanted) === JSON.stringify(found);
  const purseMatches = after.purseCopper - before.purseCopper === plan.rewardCopper;
  if (questsMatch && purseMatches && followUpStartsFresh) return null;
  return CHANGES_ANOTHER_QUEST;
}
