import { getDictionary, type Locale } from "@/dictionaries";

import { JoinForm } from "./join-form";

export default async function JoinGamePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <JoinForm dict={dict} lang={lang} />;
}
