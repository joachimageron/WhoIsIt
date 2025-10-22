import { CreateGameForm } from "./create-game-form";

import { getDictionary } from "@/dictionaries";

export default async function CreateGamePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <CreateGameForm dict={dict} lang={lang} />;
}
