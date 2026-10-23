import { getDictionary, type Locale } from "@/dictionaries";

import { RegisterForm } from "./register-form";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);

  return <RegisterForm dict={dict} lang={lang} />;
}
