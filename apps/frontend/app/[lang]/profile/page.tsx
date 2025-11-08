import type { Metadata } from "next";

import { ProfileForm } from "./profile-form";

import { getDictionary, type Locale } from "@/dictionaries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const title = lang === "fr" ? "Profil" : "Profile";
  const description =
    lang === "fr"
      ? "Gérez votre profil et vos paramètres Who Is It"
      : "Manage your Who Is It profile and settings";

  return {
    title,
    description,
    robots: {
      index: false, // Don't index profile pages
      follow: true,
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <ProfileForm dict={dict} lang={lang} />;
}
