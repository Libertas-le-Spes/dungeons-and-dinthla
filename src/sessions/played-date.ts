import type { NewSession } from "./create-session";

export function playedDateOf(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

export function withPlayedDate(session: NewSession, now: Date): NewSession {
  if (session.played !== "") return session;
  return { ...session, played: playedDateOf(now) };
}
