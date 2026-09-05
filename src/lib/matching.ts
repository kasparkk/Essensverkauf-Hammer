import type { Request, Trip } from "@/generated/prisma/client";

export type MatchReason = { label: string; good: boolean };

export type Match<T> = {
  item: T;
  score: number;
  reasons: MatchReason[];
};

const normalize = (value: string | null | undefined) =>
  (value ?? "").trim().toLowerCase();

/**
 * Bewertet, wie gut eine Reise zu einer Anfrage passt.
 *
 * Die Route ist das Ausschlusskriterium: stimmt weder Start- noch Zielland,
 * ist es kein Treffer. Alles andere - Städte, Datum vor Deadline, Kapazität,
 * Liefermodus - erhöht oder senkt die Punktzahl und wird dem Nutzer als
 * Begründung angezeigt, damit die Reihenfolge nachvollziehbar bleibt.
 */
export function scoreMatch(request: Request, trip: Trip): Match<Trip> | null {
  const reasons: MatchReason[] = [];

  const fromCountryMatch = normalize(request.fromCountry) === normalize(trip.fromCountry);
  const toCountryMatch = normalize(request.toCountry) === normalize(trip.toCountry);

  if (!fromCountryMatch || !toCountryMatch) {
    return null;
  }

  let score = 50;
  reasons.push({
    label: `Route passt: ${trip.fromCountry} → ${trip.toCountry}`,
    good: true,
  });

  // Gleiche Städte sparen die letzte Meile komplett.
  const fromCityMatch =
    normalize(request.fromCity) !== "" &&
    normalize(request.fromCity) === normalize(trip.fromCity);
  const toCityMatch =
    normalize(request.toCity) !== "" &&
    normalize(request.toCity) === normalize(trip.toCity);

  if (fromCityMatch) {
    score += 15;
    reasons.push({ label: `Abholort identisch: ${trip.fromCity}`, good: true });
  }
  if (toCityMatch) {
    score += 15;
    reasons.push({ label: `Zielort identisch: ${trip.toCity}`, good: true });
  }

  // Reise muss vor der Deadline stattfinden.
  if (request.deadline) {
    const travel = new Date(trip.travelDate).getTime();
    const deadline = new Date(request.deadline).getTime();
    const daysEarly = Math.round((deadline - travel) / 86_400_000);

    if (travel > deadline) {
      score -= 40;
      reasons.push({
        label: `Reise ist ${Math.abs(daysEarly)} Tage nach der Deadline`,
        good: false,
      });
    } else {
      // Je knapper vor der Deadline, desto besser - lange Vorlaufzeit ist
      // unpraktisch, wenn der Gegenstand noch beschafft werden muss.
      score += daysEarly <= 14 ? 15 : 5;
      reasons.push({
        label:
          daysEarly === 0
            ? "Reise genau am Stichtag"
            : `${daysEarly} Tage vor der Deadline`,
        good: true,
      });
    }
  }

  // Kapazität gegen Gewicht.
  if (request.weightKg != null && trip.capacityKg != null) {
    if (trip.capacityKg >= request.weightKg) {
      score += 10;
      reasons.push({
        label: `Platz reicht (${trip.capacityKg} kg frei, ${request.weightKg} kg nötig)`,
        good: true,
      });
    } else {
      score -= 30;
      reasons.push({
        label: `Zu wenig Platz (${trip.capacityKg} kg frei, ${request.weightKg} kg nötig)`,
        good: false,
      });
    }
  }

  // Postversand auf der letzten Meile.
  if (request.deliveryMode === "POSTAL") {
    if (trip.offersPostal) {
      score += 10;
      reasons.push({ label: "Reisender gibt am Ziel bei der Post ab", good: true });
    } else {
      score -= 20;
      reasons.push({
        label: "Anfrage will Postabgabe, Reisender bietet nur Übergabe",
        good: false,
      });
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
