import { VerifyEmailForm } from "./verify-email-form";

import { getDictionary, type Locale } from "@/dictionaries";

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ lang: Locale; "verify-token": string }>;
}) {
  const { lang, "verify-token": token } = await params;
  const dict = await getDictionary(lang);

  return <VerifyEmailForm dict={dict} lang={lang} token={token} />;
}
