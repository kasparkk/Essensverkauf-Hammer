export const locales = ["en", "de", "es", "pt", "fr", "it", "nl", "pl"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Anzeigenamen in der jeweiligen Sprache selbst. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
  pt: "Português",
  fr: "Français",
  it: "Italiano",
  nl: "Nederlands",
  pl: "Polski",
};

export const LOCALE_COOKIE = "locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return locales.includes(value as Locale);
}

/**
 * Wählt aus einem Accept-Language-Header die beste unterstützte Sprache.
 * Beispiel: "pt-BR,pt;q=0.9,en;q=0.8" → "pt"
 */
export function pickLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  const ranked = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const quality = params
        .map((param) => param.trim())
        .find((param) => param.startsWith("q="));
      return {
        base: tag.trim().toLowerCase().split("-")[0],
        quality: quality ? Number.parseFloat(quality.slice(2)) || 0 : 1,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  return ranked.find((entry) => isLocale(entry.base))?.base as Locale ?? defaultLocale;
}

/** Ersetzt {platzhalter} in einem Textbaustein. */
export function format(
  template: string,
  params: Record<string, string | number> = {}
) {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in params ? String(params[key]) : match
  );
}
