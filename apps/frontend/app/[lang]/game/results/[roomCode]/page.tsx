import type { Locale } from "@/dictionaries";

import { GameResultsClient } from "./results-client";

import { getDictionary } from "@/dictionaries";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ lang: string; roomCode: string }>;
}) {
  const { lang, roomCode } = await params;
  const dict = await getDictionary(lang as Locale);

  return <GameResultsClient dict={dict} lang={lang} roomCode={roomCode} />;
}
