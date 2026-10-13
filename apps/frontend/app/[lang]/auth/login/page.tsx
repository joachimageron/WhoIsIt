import { getDictionary, type Locale } from "@/dictionaries";

import { LoginForm } from "./login-form";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);

  return <LoginForm dict={dict} lang={lang} />;
}
