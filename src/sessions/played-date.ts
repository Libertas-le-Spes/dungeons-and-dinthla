function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

export function playedDateOf(date: Date): string {
  return `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}-${twoDigits(date.getDate())}`;
}
