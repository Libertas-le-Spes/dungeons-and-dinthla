import { buildCampaign } from "../campaign/build-campaign";
import type { Campaign, CoinRecord, QuestRecord, QuestStatus, SessionNote } from "../campaign/campaign";
import type { Removal } from "../campaign/note-editor";
import { sessionNoteOf } from "../campaign/session-file";
import { closingRemoval } from "../campaign/thread-removal";
import { readLedgerEntry } from "../notes/ledger";
import { appendLines, removeLines } from "../notes/note-lines";
import { followUpQuestLine, isCoinReward, outcomeLine, progressLine, questTextOf, rewardLine } from "../notes/quest-lines";
import { readMarker } from "../notes/marker";
import { readQuest } from "../notes/quest";
import { oneLine } from "../notes/thread-lines";

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

export function canCollectReward(record: QuestRecord, coins: CoinRecord[]): boolean {
  const reward = record.reward;
  if (reward === undefined || !isCoinReward(reward) || rewardCopperOf(reward, record.text) === null) return false;
  const collected = coins.some((coin) => coin.text.endsWith(`, for: ${record.text}`));
  return !collected;
}

export function outcomeRemoval(record: QuestRecord): Removal | null {
  return closingRemoval(record, (outcome) => outcome.status);
}

export function initialQuestEdit(record: QuestRecord): QuestEdit {
  if (record.closing === null) return { status: "active", happened: "", collectReward: true, followUp: "" };
  return { status: record.closing.status, happened: record.closing.text, collectReward: false, followUp: "" };
}

export function planQuestSave(record: QuestRecord, edit: QuestEdit, coins: CoinRecord[], sessionPath: string): QuestPlan {
  let targetPath = sessionPath;
  const title = record.text;
  const happened = oneLine(edit.happened);
  const added: string[] = [];
  const progress = record.notes.map((note) => placed(note.source.path, note.text));
  let outcome: string | null = null;
  if (record.closing !== null) outcome = outcomeKey(record.closing.status, record.closing.text, record.closing.source.path);
  let removal: Removal | null = null;
  if (edit.status === "active") {
    removal = outcomeRemoval(record);
    outcome = null;
    if (happened !== "") {
      added.push(progressLine(title, happened));
      progress.push(placed(targetPath, happened));
    }
  } else if (record.closing === null || record.closing.status !== edit.status || oneLine(record.closing.text) !== happened) {
    added.push(outcomeLine(edit.status, title, happened));
    removal = outcomeRemoval(record);
    if (record.closing !== null) targetPath = record.closing.source.path;
    outcome = outcomeKey(edit.status, happened, targetPath);
  }
  let rewardCopper = 0;
  if (edit.status === "completed" && edit.collectReward && canCollectReward(record, coins)) {
    added.push(rewardLine(record.reward!, title));
    rewardCopper = rewardCopperOf(record.reward!, title)!;
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

function applyPlan(sessions: SessionNote[], plan: QuestPlan): SessionNote[] {
  return sessions.map((session) => {
    let text = session.text;
    if (plan.removal !== null && plan.removal.path === session.path) text = removeLines(text, [plan.removal]).text;
    if (session.path === plan.targetPath) text = appendLines(text, plan.added);
    return sessionNoteOf(session.path, session.number, text);
  });
}

function signatureOf(record: QuestRecord): string {
  let outcome = "";
  if (record.closing !== null) outcome = outcomeKey(record.closing.status, record.closing.text, record.closing.source.path);
  return JSON.stringify([record.source.path, record.text, record.notes.map((note) => placed(note.source.path, note.text)), outcome]);
}

function expectedSignature(record: QuestRecord, expected: ExpectedQuest): string {
  let outcome = "";
  if (expected.outcome !== null) outcome = expected.outcome;
  return JSON.stringify([record.source.path, record.text, expected.progress, outcome]);
}

function questsBesidesFollowUp(campaign: Campaign, plan: QuestPlan): QuestRecord[] {
  const quests = [...campaign.quests];
  if (plan.followUpTitle === null) return quests;
  for (let index = quests.length - 1; index >= 0; index--) {
    const candidate = quests[index]!;
    if (candidate.source.path === plan.targetPath && candidate.text === plan.followUpTitle) {
      quests.splice(index, 1);
      break;
    }
  }
  return quests;
}

export function refusalForQuestPlan(sessions: SessionNote[], record: QuestRecord, plan: QuestPlan): string | null {
  if (!sessions.some((session) => session.path === plan.targetPath)) return CHANGES_ANOTHER_QUEST;
  const before = buildCampaign(sessions);
  const after = buildCampaign(applyPlan(sessions, plan));
  const wanted = before.quests.map((quest) => {
    const isOpened = quest.source.path === record.source.path && quest.source.line === record.source.line;
    if (isOpened) return expectedSignature(record, plan.expected);
    return signatureOf(quest);
  });
  const found = questsBesidesFollowUp(after, plan).map(signatureOf);
  const followUpStartsFresh = after.quests.every(
    (quest) => quest.text !== plan.followUpTitle || quest.source.path !== plan.targetPath || (quest.notes.length === 0 && quest.closing === null),
  );
  const questsMatch = JSON.stringify(wanted) === JSON.stringify(found);
  const purseMatches = after.purseCopper - before.purseCopper === plan.rewardCopper;
  if (questsMatch && purseMatches && followUpStartsFresh) return null;
  return CHANGES_ANOTHER_QUEST;
}
