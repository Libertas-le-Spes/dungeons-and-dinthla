import type { NewSession } from "./create-session";

function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

export function playedDateOf(date: Date): string {
  return `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`;
}

export function withPlayedDate(session: NewSession, now: Date): NewSession {
  if (session.played !== "") return session;
  return { ...session, played: playedDateOf(now) };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PLAYED = /^(\d{4})-(\d{2})-(\d{2})$/;

export function shownPlayedDate(played: string): string {
  const match = PLAYED.exec(played);
  if (match === null) return "";
  const [, year, month, day] = match;
  if (year === undefined || month === undefined || day === undefined) return "";
  const monthName = MONTHS[Number.parseInt(month, 10) - 1];
  const dayNumber = Number.parseInt(day, 10);
  if (monthName === undefined || dayNumber < 1 || dayNumber > 31) return "";
  return `${dayNumber} ${monthName} ${year}`;
}
