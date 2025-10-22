import { Link } from "@heroui/link";
import { button as buttonStyles } from "@heroui/theme";
import { Card, CardBody } from "@heroui/card";

import { title, subtitle } from "@/components/primitives";
import { getDictionary, type Locale } from "@/dictionaries";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <section className="flex flex-col items-center justify-center gap-8 py-8 md:py-10">
      {/* Hero Section */}
      <div className="inline-block max-w-3xl text-center justify-center">
        <div className="mb-6">
          <span className={title({ size: "lg" })}>
            {dict.home.title1}&nbsp;
          </span>
          <span className={title({ size: "lg", color: "violet" })}>
            {dict.home.title2}&nbsp;
          </span>
          <br />
          <span className={title({ size: "lg" })}>{dict.home.title3}</span>
        </div>
        <div className={subtitle({ class: "mt-4 max-w-2xl" })}>
          {dict.home.subtitle}
        </div>
      </div>

      {/* Call to Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md px-4">
        <Link
          className={buttonStyles({
            color: "primary",
            radius: "lg",
            variant: "shadow",
            size: "lg",
            class: "w-full font-semibold",
          })}
          href={`/${lang}/game/create`}
        >
          {dict.home.createGameButton}
        </Link>
        <Link
          className={buttonStyles({
            color: "secondary",
            radius: "lg",
            variant: "bordered",
            size: "lg",
            class: "w-full font-semibold",
          })}
          href={`/${lang}/game/join`}
        >
          {dict.home.joinGameButton}
        </Link>
      </div>

      {/* How to Play Section */}
      <div className="mt-12 w-full max-w-4xl px-4">
        <h2 className={title({ size: "sm", class: "text-center mb-8" })}>
          {dict.home.howToPlay}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10">
            <CardBody className="text-center p-6">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-bold mb-2">
                {lang === "fr" ? "1. Créez ou Rejoignez" : "1. Create or Join"}
              </h3>
              <p className="text-default-600">
                {lang === "fr"
                  ? "Démarrez une nouvelle partie ou rejoignez une partie existante avec un code"
                  : "Start a new game or join an existing one with a room code"}
              </p>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
            <CardBody className="text-center p-6">
              <div className="text-4xl mb-4">❓</div>
              <h3 className="text-xl font-bold mb-2">
                {lang === "fr" ? "2. Posez des Questions" : "2. Ask Questions"}
              </h3>
              <p className="text-default-600">
                {lang === "fr"
                  ? "Posez des questions pour éliminer les personnages et trouver celui de votre adversaire"
                  : "Ask questions to eliminate characters and find your opponent's mystery character"}
              </p>
            </CardBody>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10">
            <CardBody className="text-center p-6">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold mb-2">
                {lang === "fr" ? "3. Gagnez !" : "3. Win!"}
              </h3>
              <p className="text-default-600">
                {lang === "fr"
                  ? "Soyez le premier à deviner le personnage mystère de votre adversaire"
                  : "Be the first to guess your opponent's mystery character"}
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </section>
  );
}
