import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import ContactButton from "@/components/contact-button";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [itemRequest, user] = await Promise.all([
    prisma.request.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } },
    }),
    getCurrentUser(),
  ]);

  if (!itemRequest) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <p className="text-sm text-neutral-500">Anfrage von {itemRequest.user.name}</p>
      <h1 className="mt-1 text-2xl font-bold">{itemRequest.itemDescription}</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-300">
        {itemRequest.fromCountry} → {itemRequest.toCountry}
      </p>
      <p className="mt-1 text-sm text-neutral-500">
        Erstellt am {formatDate(itemRequest.createdAt)}
      </p>
      {itemRequest.notes && (
        <p className="mt-4 whitespace-pre-wrap rounded-lg bg-neutral-50 p-4 text-sm dark:bg-neutral-900">
          {itemRequest.notes}
        </p>
      )}

      <div className="mt-8">
        <ContactButton
          requestId={itemRequest.id}
          isLoggedIn={Boolean(user)}
          isOwn={user?.id === itemRequest.userId}
        />
      </div>
    </div>
  );
}
