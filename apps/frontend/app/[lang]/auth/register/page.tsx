import { getDictionary, type Locale } from "@/dictionaries";

import { RegisterForm } from "./register-form";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <RegisterForm dict={dict} lang={lang} />;
}
