import type { Deal, DealStatus } from "@/generated/prisma/client";

type Role = "requester" | "traveler" | "counterpart";

/**
 * Erlaubte Übergänge im Ablauf einer Abmachung.
 * "counterpart" heißt: nur die Seite, die den Deal nicht vorgeschlagen hat -
 * so kann niemand seinen eigenen Vorschlag annehmen.
 */
const transitions: Record<DealStatus, Partial<Record<DealStatus, Role[]>>> = {
  PROPOSED: {
    ACCEPTED: ["counterpart"],
    CANCELLED: ["requester", "traveler"],
  },
  ACCEPTED: {
    PICKED_UP: ["traveler"],
    CANCELLED: ["requester", "traveler"],
  },
  PICKED_UP: {
    DELIVERED: ["traveler"],
    CANCELLED: ["requester", "traveler"],
  },
  DELIVERED: {
    CONFIRMED: ["requester"],
  },
  CONFIRMED: {},
  CANCELLED: {},
};

function rolesOf(deal: Deal, userId: string): Role[] {
  const roles: Role[] = [];
  if (deal.requesterId === userId) roles.push("requester");
  if (deal.travelerId === userId) roles.push("traveler");
  if (roles.length > 0 && deal.proposedById !== userId) roles.push("counterpart");
  return roles;
}

/** Nächste Schritte, die dieser Nutzer bei dieser Abmachung gehen darf. */
export function allowedNextStatuses(deal: Deal, userId: string): DealStatus[] {
  const roles = rolesOf(deal, userId);
  if (roles.length === 0) return [];

  return Object.entries(transitions[deal.status])
    .filter(([, allowedRoles]) => allowedRoles?.some((role) => roles.includes(role)))
    .map(([next]) => next as DealStatus);
}

/** Reihenfolge des Ablaufs für die Fortschrittsanzeige. */
export const dealFlow: DealStatus[] = [
  "PROPOSED",
  "ACCEPTED",
  "PICKED_UP",
  "DELIVERED",
  "CONFIRMED",
];
