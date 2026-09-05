import { getTranslations } from "@/lib/i18n/server";
import RegisterForm from "./register-form";

export default async function RegisterPage() {
  const { dict } = await getTranslations();

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <RegisterForm t={dict.auth} />
    </div>
  );
}
