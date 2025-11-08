import type { Metadata } from "next";

import { CreateGameForm } from "./create-game-form";

import { getDictionary, Locale } from "@/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const title = lang === "fr" ? "Créer une Partie" : "Create Game";
  const description =
    lang === "fr"
      ? "Créez une nouvelle partie de Who Is It et invitez vos amis à jouer"
      : "Create a new Who Is It game and invite your friends to play";

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

export default async function CreateGamePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <CreateGameForm dict={dict} lang={lang} />;
}
