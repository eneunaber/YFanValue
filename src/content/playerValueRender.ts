const positiveValueColor = "#16a34a";
const negativeValueColor = "#dc2626";

export interface PlayerValueBadge {
  color: string;
  text: string;
}

export interface PlayerValueRenderModel {
  badges: PlayerValueBadge[];
  combinedText: string;
}

export function buildPlayerValueRenderModel(
  draftValue: string | undefined,
  currentValue: string | undefined
): PlayerValueRenderModel {
  const badges = [draftValue, currentValue]
    .filter((value): value is string => value != null)
    .map((value) => ({
      text: `[${value}]`,
      color: value.startsWith("-") ? negativeValueColor : positiveValueColor
    }));

  return {
    badges,
    combinedText: badges.map((badge) => badge.text).join("")
  };
}

export function shouldUpdatePlayerValue(existingText: string | null, combinedText: string): boolean {
  return Boolean(combinedText) && existingText !== ` ${combinedText}`;
}
