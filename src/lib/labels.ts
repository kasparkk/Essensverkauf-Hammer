import type {
  DealStatus,
  DeliveryMode,
  RequestKind,
  TransportMode,
} from "@/generated/prisma/client";

export const transportModeLabels: Record<TransportMode, string> = {
  FLIGHT: "✈️ Flug",
  TRAIN: "🚆 Zug",
  CAR: "🚗 Auto",
  BUS: "🚌 Bus",
};

export const requestKindLabels: Record<RequestKind, string> = {
  RETRIEVAL: "Liegengelassen",
  SHOPPING: "Einkauf",
  TRANSPORT: "Transport",
};

export const requestKindDescriptions: Record<RequestKind, string> = {
  RETRIEVAL: "Etwas vergessen und zurück nach Hause holen",
  SHOPPING: "Etwas im Ausland kaufen und mitbringen lassen",
  TRANSPORT: "Einen Gegenstand von A nach B bringen lassen",
};

export const deliveryModeLabels: Record<DeliveryMode, string> = {
  HANDOFF: "Persönliche Übergabe",
  POSTAL: "Abgabe bei der Post am Ziel",
  EITHER: "Übergabe oder Post",
};

export const dealStatusLabels: Record<DealStatus, string> = {
  PROPOSED: "Vorgeschlagen",
  ACCEPTED: "Angenommen",
  PICKED_UP: "Abgeholt",
  DELIVERED: "Geliefert",
  CONFIRMED: "Bestätigt",
  CANCELLED: "Abgebrochen",
};

/** Reihenfolge des Ablaufs für die Fortschrittsanzeige. */
export const dealFlow: DealStatus[] = [
  "PROPOSED",
  "ACCEPTED",
  "PICKED_UP",
  "DELIVERED",
  "CONFIRMED",
];

export function formatMoney(cents: number | null | undefined) {
  if (cents == null) return null;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function formatWeight(kg: number | null | undefined) {
  if (kg == null) return null;
  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(kg)} kg`;
}

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
