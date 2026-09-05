import type { Locale } from "@/lib/i18n/config";

/**
 * Intl braucht vollständige BCP-47-Tags für sinnvolle Formate;
 * "pt" allein liefert z. B. europäisch-portugiesische Konventionen.
 */
const intlLocales: Record<Locale, string> = {
  en: "en-GB",
  de: "de-DE",
  es: "es-ES",
  pt: "pt-PT",
  fr: "fr-FR",
};

export function formatDate(date: Date | string, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocales[locale], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string, locale: Locale) {
  return new Intl.DateTimeFormat(intlLocales[locale], {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatMoney(cents: number | null | undefined, locale: Locale) {
  if (cents == null) return null;
  return new Intl.NumberFormat(intlLocales[locale], {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function formatWeight(kg: number | null | undefined, locale: Locale) {
  if (kg == null) return null;
  const value = new Intl.NumberFormat(intlLocales[locale], {
    maximumFractionDigits: 1,
  }).format(kg);
  return `${value} kg`;
}

/** "Berlin, Deutschland → New York, USA" - Städte sind optional. */
export function routeLabel(
  fromCity: string | null,
  fromCountry: string,
  toCity: string | null,
  toCountry: string
) {
  const from = fromCity ? `${fromCity}, ${fromCountry}` : fromCountry;
  const to = toCity ? `${toCity}, ${toCountry}` : toCountry;
  return `${from} → ${to}`;
}
