import { getTranslations } from "@/lib/i18n/server";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const { dict } = await getTranslations();

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <LoginForm t={dict.auth} />
    </div>
  );
}
