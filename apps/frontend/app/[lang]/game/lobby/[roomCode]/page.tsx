import { getDictionary, type Locale } from "@/dictionaries";

import { LobbyClient } from "./lobby-client";

export default async function LobbyPage({
  params,
}: {
  params: Promise<{ lang: string; roomCode: string }>;
}) {
  const { lang: langParam, roomCode } = await params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);

  return <LobbyClient dict={dict} lang={lang} roomCode={roomCode} />;
}
