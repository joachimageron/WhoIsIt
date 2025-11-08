import type { Metadata } from "next";

import { RegisterForm } from "./register-form";

import { getDictionary, type Locale } from "@/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const title = lang === "fr" ? "Inscription" : "Register";
  const description =
    lang === "fr"
      ? "Créez votre compte Who Is It et commencez à jouer"
      : "Create your Who Is It account and start playing";

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

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <RegisterForm dict={dict} lang={lang} />;
}
