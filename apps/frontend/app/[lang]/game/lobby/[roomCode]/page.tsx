import { getDictionary, type Locale } from "@/dictionaries";

import { LobbyClient } from "./lobby-client";

export default async function LobbyPage({
  params,
}: {
  params: Promise<{ lang: Locale; roomCode: string }>;
}) {
  const { lang, roomCode } = await params;
  const dict = await getDictionary(lang);

  return <LobbyClient dict={dict} lang={lang} roomCode={roomCode} />;
}
