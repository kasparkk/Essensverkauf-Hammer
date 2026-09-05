import { getCurrentUser } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n/server";
import LoginRequired from "@/components/login-required";
import NewRequestForm from "./new-request-form";

export default async function NewRequestPage() {
  const [user, { dict }] = await Promise.all([getCurrentUser(), getTranslations()]);

  if (!user) {
    return <LoginRequired t={dict.auth} />;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-2xl font-bold">{dict.requests.newHeading}</h1>
      <p className="mt-1 text-sm text-neutral-500">{dict.requests.newIntro}</p>
      <NewRequestForm t={dict.requests} enums={dict.enums} />
    </div>
  );
}
