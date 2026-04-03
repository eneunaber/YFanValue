export function validatePlayerValueUrls(playerValueUrlOne: string, playerValueUrlTwo: string): string | null {
  if (!playerValueUrlOne && !playerValueUrlTwo) {
    return "Please enter at least one valid URL.";
  }

  if (!isValidOptionalUrl(playerValueUrlOne) || !isValidOptionalUrl(playerValueUrlTwo)) {
    return "Please enter valid http or https URLs.";
  }

  return null;
}

export function getUrlsToTest(playerValueUrlOne: string, playerValueUrlTwo: string): string[] {
  return [playerValueUrlOne, playerValueUrlTwo].filter((url): url is string => Boolean(url));
}

export function isValidOptionalUrl(value: string): boolean {
  return !value || isValidUrl(value);
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
