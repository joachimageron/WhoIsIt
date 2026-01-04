import { getDictionary, Locale } from "@/dictionaries";

import { CreateGameForm } from "./create-game-form";

export default async function CreateGamePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <CreateGameForm dict={dict} lang={lang} />;
}
