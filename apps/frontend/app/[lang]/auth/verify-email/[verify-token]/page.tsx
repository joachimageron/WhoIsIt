import { getDictionary, type Locale } from "@/dictionaries";

import { VerifyEmailForm } from "./verify-email-form";

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ lang: Locale; "verify-token": string }>;
}) {
  const { lang, "verify-token": token } = await params;
  const dict = await getDictionary(lang);

  return <VerifyEmailForm dict={dict} lang={lang} token={token} />;
}
