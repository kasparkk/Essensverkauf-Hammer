import { cookies, headers } from "next/headers";
import { isLocale, LOCALE_COOKIE, pickLocale, type Locale } from "./config";
import type { Dictionary } from "./types";
import en from "./dictionaries/en";
import de from "./dictionaries/de";
import es from "./dictionaries/es";
import pt from "./dictionaries/pt";
import fr from "./dictionaries/fr";

const dictionaries: Record<Locale, Dictionary> = { en, de, es, pt, fr };

/**
 * Aktive Sprache: erst die ausdrückliche Wahl im Cookie, sonst was der
 * Browser über Accept-Language mitschickt, sonst Englisch.
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const chosen = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;

  const headerStore = await headers();
  return pickLocale(headerStore.get("accept-language"));
}

export async function getDictionary(): Promise<Dictionary> {
  return dictionaries[await getLocale()];
}

/** Sprache und Wörterbuch zusammen - der häufigste Fall in Seiten. */
export async function getTranslations(): Promise<{
  locale: Locale;
  dict: Dictionary;
}> {
  const locale = await getLocale();
  return { locale, dict: dictionaries[locale] };
}

export function dictionaryFor(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Fehlermeldungen der API in der Sprache des Aufrufers. */
export async function getErrors(): Promise<Dictionary["errors"]> {
  return (await getDictionary()).errors;
}

/**
 * Zod-Schemas liegen auf Modulebene und kennen die Sprache noch nicht, daher
 * tragen sie als Meldung den Schlüssel aus dict.errors. Hier wird daraus der
 * übersetzte Text - unbekannte Meldungen fallen auf "ungültige Eingabe" zurück.
 */
export function translateIssue(
  message: string | undefined,
  errors: Dictionary["errors"]
): string {
  if (message && message in errors) {
    return errors[message as keyof Dictionary["errors"]];
  }
  return errors.invalidInput;
}
