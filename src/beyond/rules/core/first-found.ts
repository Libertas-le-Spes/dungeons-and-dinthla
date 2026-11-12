function always(): boolean {
  return true;
}

export function firstFound<T>(list: readonly T[]): T | undefined {
  return list.find(always);
}
