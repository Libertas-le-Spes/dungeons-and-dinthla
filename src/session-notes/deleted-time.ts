const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

export function shownDeletedTime(deletedAt: number): string {
  const date = new Date(deletedAt);
  const day = `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  return `${day}, ${twoDigits(date.getHours())}:${twoDigits(date.getMinutes())}`;
}
