import { JoinForm } from "./join-form";

import { getDictionary, type Locale } from "@/dictionaries";

export default async function JoinGamePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <JoinForm dict={dict} lang={lang} />;
}
