const MOJIBAKE_PATTERN = /(?:Ã.|Ä.|È.|Å.|Â|â€¢|â€“|â€”|â€œ|â€|â€˜|â€™|â€ž)/;
const NORMALIZED_TEXT_CACHE_MAX_SIZE = 2000;
const SEARCH_TEXT_CACHE_MAX_SIZE = 4000;
const normalizedTextCache = new Map<string, string>();
const normalizedSearchTextCache = new Map<string, string>();

const MOJIBAKE_REPLACEMENTS: [string, string][] = [
  ["ÃŽ", "Î"],
  ["Ã®", "î"],
  ["Ã‚", "Â"],
  ["Ã¢", "â"],
  ["Ä‚", "Ă"],
  ["Äƒ", "ă"],
  ["È˜", "Ș"],
  ["È™", "ș"],
  ["Èš", "Ț"],
  ["È›", "ț"],
  ["Åž", "Ș"],
  ["ÅŸ", "ș"],
  ["Å¢", "Ț"],
  ["Å£", "ț"],
  ["â€¢", "•"],
  ["â€“", "–"],
  ["â€”", "—"],
  ["â€œ", "“"],
  ["â€", "”"],
  ["â€˜", "‘"],
  ["â€™", "’"],
  ["â€ž", "„"],
  ["Â ", " "],
  ["Â", ""],
];

export function normalizeRomanianText(value: string): string {
  const cachedValue = normalizedTextCache.get(value);
  if (cachedValue !== undefined) {
    return cachedValue;
  }

  const normalizedValue = normalizeRomanianTextCore(value);
  setBoundedCacheValue(
    normalizedTextCache,
    NORMALIZED_TEXT_CACHE_MAX_SIZE,
    value,
    normalizedValue
  );
  return normalizedValue;
}

export function normalizeTextForSearch(value: string): string {
  const cachedValue = normalizedSearchTextCache.get(value);
  if (cachedValue !== undefined) {
    return cachedValue;
  }

  const normalizedValue = normalizeRomanianText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("ro-RO")
    .trim();

  setBoundedCacheValue(
    normalizedSearchTextCache,
    SEARCH_TEXT_CACHE_MAX_SIZE,
    value,
    normalizedValue
  );
  return normalizedValue;
}

function setBoundedCacheValue(
  cache: Map<string, string>,
  maxSize: number,
  key: string,
  value: string
): void {
  if (cache.size >= maxSize) {
    cache.clear();
  }

  cache.set(key, value);
}

function normalizeRomanianTextCore(value: string): string {
  if (!MOJIBAKE_PATTERN.test(value)) {
    return value;
  }

  let normalized = value;
  for (const [mojibake, corrected] of MOJIBAKE_REPLACEMENTS) {
    normalized = normalized.split(mojibake).join(corrected);
  }

  return normalized.normalize("NFC");
}

export const __normalizedTextForTests = {
  resetCache(): void {
    normalizedTextCache.clear();
    normalizedSearchTextCache.clear();
  },
  getCacheSize(): number {
    return normalizedTextCache.size;
  },
  getCacheMaxSize(): number {
    return NORMALIZED_TEXT_CACHE_MAX_SIZE;
  },
  getSearchCacheSize(): number {
    return normalizedSearchTextCache.size;
  },
  getSearchCacheMaxSize(): number {
    return SEARCH_TEXT_CACHE_MAX_SIZE;
  },
};
