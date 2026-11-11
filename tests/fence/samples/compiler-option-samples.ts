const LABELS = 'const LABELS: Record<"AC" | "HP", string> = { AC: "Armor Class", HP: "Hit Points" };\n';

export const OPTION_DEPENDENT_SAMPLES = [
  `${LABELS}export const label = (names: ("AC" | "HP")[]) => LABELS[names[0]];`,
  `${LABELS}export const label = (name?: "AC" | "HP") => LABELS[name];`,
];

export const OPTION_FREE_SAMPLE = `${LABELS}export const label = (name: "AC" | "HP") => LABELS[name];`;
