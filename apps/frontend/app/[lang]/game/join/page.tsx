import type { Metadata } from "next";

import { JoinForm } from "./join-form";

import { getDictionary, type Locale } from "@/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const title = lang === "fr" ? "Rejoindre une Partie" : "Join Game";
  const description =
    lang === "fr"
      ? "Rejoignez une partie de Who Is It avec un code de salle"
      : "Join a Who Is It game with a room code";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
  };
}

export default async function JoinGamePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <JoinForm dict={dict} lang={lang} />;
}
