const PAD_TO = 2;
const PAD_WITH = "0";
const MONTHS_START_AT = 1;

function padded(number: number): string {
  return String(number).padStart(PAD_TO, PAD_WITH);
}

export function dayOf(moment: Date): string {
  return `${moment.getFullYear()}-${padded(moment.getMonth() + MONTHS_START_AT)}-${padded(moment.getDate())}`;
}
