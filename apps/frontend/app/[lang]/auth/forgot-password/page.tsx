import { getDictionary, type Locale } from "@/dictionaries";

import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);

  return <ForgotPasswordForm dict={dict} lang={lang} />;
}
