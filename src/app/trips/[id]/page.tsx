import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import ContactButton from "@/components/contact-button";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [trip, user] = await Promise.all([
    prisma.trip.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } },
    }),
    getCurrentUser(),
  ]);

  if (!trip) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <p className="text-sm text-neutral-500">Reise von {trip.user.name}</p>
      <h1 className="mt-1 text-2xl font-bold">
        {trip.fromCity ? `${trip.fromCity}, ` : ""}
        {trip.fromCountry} → {trip.toCity ? `${trip.toCity}, ` : ""}
        {trip.toCountry}
      </h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-300">
        Reisedatum: {formatDate(trip.travelDate)}
      </p>
      {trip.notes && (
        <p className="mt-4 whitespace-pre-wrap rounded-lg bg-neutral-50 p-4 text-sm dark:bg-neutral-900">
          {trip.notes}
        </p>
      )}

      <div className="mt-8">
        <ContactButton
          tripId={trip.id}
          isLoggedIn={Boolean(user)}
          isOwn={user?.id === trip.userId}
        />
      </div>
    </div>
  );
}
