import { getDictionary, type Locale } from "@/dictionaries";

import { JoinForm } from "./join-form";

export default async function JoinGamePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);

  return <JoinForm dict={dict} lang={lang} />;
}
