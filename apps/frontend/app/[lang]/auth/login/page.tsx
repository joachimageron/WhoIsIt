import type { Metadata } from "next";

import { LoginForm } from "./login-form";

import { getDictionary, type Locale } from "@/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const title = lang === "fr" ? "Connexion" : "Login";
  const description =
    lang === "fr"
      ? "Connectez-vous à votre compte Who Is It"
      : "Sign in to your Who Is It account";

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

export default async function LoginPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <LoginForm dict={dict} lang={lang} />;
}
