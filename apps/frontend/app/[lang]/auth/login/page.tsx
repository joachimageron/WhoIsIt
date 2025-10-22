import { LoginForm } from "./login-form";

import { getDictionary, type Locale } from "@/dictionaries";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <LoginForm dict={dict} lang={lang} />;
}
