import { getDictionary, type Locale } from "@/dictionaries";

import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ lang: string; "reset-token": string }>;
}) {
  const { lang: langParam, "reset-token": token } = await params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);

  return <ResetPasswordForm dict={dict} lang={lang} token={token} />;
}
