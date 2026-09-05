import type { Request, Trip } from "@/generated/prisma/client";
import { format } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";

/**
 * Begründungen werden als Code plus Werte geliefert, nicht als fertiger Text -
 * so bleibt die Bewertung sprachunabhängig und wird erst in der Oberfläche
 * übersetzt.
 */
export type MatchReason = {
  code: keyof Dictionary["match"];
  params?: Record<string, string | number>;
  good: boolean;
};

export type Match<T> = {
  item: T;
  score: number;
  reasons: MatchReason[];
};

const normalize = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase();

/** Übersetzt eine Begründung in die aktive Sprache. */
export function translateReason(reason: MatchReason, dict: Dictionary): string {
  return format(dict.match[reason.code], reason.params);
}

/**
 * Bewertet, wie gut eine Reise zu einer Anfrage passt.
 *
 * Die Route ist das Ausschlusskriterium: stimmt weder Start- noch Zielland,
 * ist es kein Treffer. Alles andere - Städte, Datum vor Deadline, Kapazität,
 * Liefermodus - erhöht oder senkt die Punktzahl und wird dem Nutzer als
 * Begründung angezeigt, damit die Reihenfolge nachvollziehbar bleibt.
 */
export function scoreMatch(request: Request, trip: Trip): Match<Trip> | null {
  const fromCountryMatch = normalize(request.fromCountry) === normalize(trip.fromCountry);
  const toCountryMatch = normalize(request.toCountry) === normalize(trip.toCountry);

  if (!fromCountryMatch || !toCountryMatch) {
    return null;
  }

  const reasons: MatchReason[] = [
    {
      code: "routeMatch",
      params: { from: trip.fromCountry, to: trip.toCountry },
      good: true,
    },
  ];
  let score = 50;

  // Gleiche Städte sparen die letzte Meile komplett.
  const fromCityMatch =
    normalize(request.fromCity) !== "" &&
    normalize(request.fromCity) === normalize(trip.fromCity);
  const toCityMatch =
    normalize(request.toCity) !== "" &&
    normalize(request.toCity) === normalize(trip.toCity);

  if (fromCityMatch) {
    score += 15;
    reasons.push({
      code: "fromCityMatch",
      params: { city: trip.fromCity ?? "" },
      good: true,
    });
  }
  if (toCityMatch) {
    score += 15;
    reasons.push({
      code: "toCityMatch",
      params: { city: trip.toCity ?? "" },
      good: true,
    });
  }

  // Reise muss vor der Deadline stattfinden.
  if (request.deadline) {
    const travel = new Date(trip.travelDate).getTime();
    const deadline = new Date(request.deadline).getTime();
    const daysEarly = Math.round((deadline - travel) / 86_400_000);

    if (travel > deadline) {
      score -= 40;
      reasons.push({
        code: "afterDeadline",
        params: { days: Math.abs(daysEarly) },
        good: false,
      });
    } else {
      // Je knapper vor der Deadline, desto besser - lange Vorlaufzeit ist
      // unpraktisch, wenn der Gegenstand noch beschafft werden muss.
      score += daysEarly <= 14 ? 15 : 5;
      reasons.push(
        daysEarly === 0
          ? { code: "onDeadline", good: true }
          : { code: "beforeDeadline", params: { days: daysEarly }, good: true }
      );
    }
  }

  // Kapazität gegen Gewicht.
  if (request.weightKg != null && trip.capacityKg != null) {
    const params = { capacity: trip.capacityKg, needed: request.weightKg };
    if (trip.capacityKg >= request.weightKg) {
      score += 10;
      reasons.push({ code: "capacityFits", params, good: true });
    } else {
      score -= 30;
      reasons.push({ code: "capacityTooSmall", params, good: false });
    }
  }

  // Postversand auf der letzten Meile.
  if (request.deliveryMode === "POSTAL") {
    if (trip.offersPostal) {
      score += 10;
      reasons.push({ code: "postalOffered", good: true });
    } else {
      score -= 20;
      reasons.push({ code: "postalMissing", good: false });
    }
  }

  return { item: trip, score, reasons };
}

/** Passende Reisen zu einer Anfrage, beste zuerst. */
export function findTripsForRequest(request: Request, trips: Trip[]): Match<Trip>[] {
  return trips
    .map((trip) => scoreMatch(request, trip))
    .filter((match): match is Match<Trip> => match !== null)
    .sort((a, b) => b.score - a.score);
}

/** Passende Anfragen zu einer Reise, beste zuerst. */
export function findRequestsForTrip(
  trip: Trip,
  requests: Request[]
): Match<Request>[] {
  return requests
    .map((request) => {
      const match = scoreMatch(request, trip);
      return match && { item: request, score: match.score, reasons: match.reasons };
    })
    .filter((match): match is Match<Request> => Boolean(match))
    .sort((a, b) => b.score - a.score);
}
