import { ResetPasswordForm } from "./reset-password-form";

import { getDictionary, type Locale } from "@/dictionaries";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ lang: Locale; "reset-token": string }>;
}) {
  const { lang, "reset-token": token } = await params;
  const dict = await getDictionary(lang);

  return <ResetPasswordForm dict={dict} lang={lang} token={token} />;
}
