import type en from "./dictionaries/en";

/**
 * Struktur aller Wörterbücher, abgeleitet aus dem englischen Original.
 * Fehlt in einer Übersetzung ein Schlüssel oder ist er falsch geschrieben,
 * meldet TypeScript das beim Build.
 */
export type Dictionary = {
  -readonly [Section in keyof typeof en]: {
    -readonly [Key in keyof (typeof en)[Section]]: (typeof en)[Section][Key] extends string
      ? string
      : { -readonly [Sub in keyof (typeof en)[Section][Key]]: string };
  };
};
