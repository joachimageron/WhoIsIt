import { ProfileForm } from "./profile-form";

import { getDictionary, type Locale } from "@/dictionaries";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <ProfileForm dict={dict} lang={lang} />;
}
