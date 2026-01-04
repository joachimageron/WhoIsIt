import { getDictionary, type Locale } from "@/dictionaries";

import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <ForgotPasswordForm dict={dict} lang={lang} />;
}
