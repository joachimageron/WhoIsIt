import type { Locale } from "@/dictionaries";

import { GamePlayClient } from "./play-client";

import { getDictionary } from "@/dictionaries";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ lang: string; roomCode: string }>;
}) {
  const { lang, roomCode } = await params;
  const dict = await getDictionary(lang as Locale);

  return <GamePlayClient dict={dict} lang={lang} roomCode={roomCode} />;
}
