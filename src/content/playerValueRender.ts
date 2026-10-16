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

interface ChildMutationLike {
  addedNodes: ArrayLike<unknown>;
  removedNodes: ArrayLike<unknown>;
}

export function hasExternalPageMutations(
  mutations: ArrayLike<ChildMutationLike>,
  playerValueClassName: string
): boolean {
  return Array.from(mutations).some(({ addedNodes, removedNodes }) =>
    [...Array.from(addedNodes), ...Array.from(removedNodes)].some(
      (node) => !hasClass(node, playerValueClassName)
    )
  );
}

function hasClass(node: unknown, className: string): boolean {
  return (node as { classList?: { contains(value: string): boolean } } | null)?.classList?.contains(className) ?? false;
}
