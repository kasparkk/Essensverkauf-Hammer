import { getCurrentUser } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n/server";
import LoginRequired from "@/components/login-required";
import NewTripForm from "./new-trip-form";

export default async function NewTripPage() {
  const [user, { dict }] = await Promise.all([getCurrentUser(), getTranslations()]);

  if (!user) {
    return <LoginRequired t={dict.auth} />;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold">{dict.trips.newHeading}</h1>
      <p className="mt-1 text-sm text-neutral-500">{dict.trips.newIntro}</p>
      <NewTripForm t={dict.trips} transportModeLabels={dict.enums.transportMode} />
    </div>
  );
}
