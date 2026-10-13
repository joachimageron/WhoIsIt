import { getDictionary, Locale } from "@/dictionaries";

import { CreateGameForm } from "./create-game-form";

export default async function CreateGamePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);

  return <CreateGameForm dict={dict} lang={lang} />;
}
