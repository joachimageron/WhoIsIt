import { getDictionary, type Locale } from "@/dictionaries";

import { VerifyEmailForm } from "./verify-email-form";

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ lang: string; "verify-token": string }>;
}) {
  const { lang: langParam, "verify-token": token } = await params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);

  return <VerifyEmailForm dict={dict} lang={lang} token={token} />;
}
