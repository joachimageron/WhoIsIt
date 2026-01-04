import { getDictionary, type Locale } from "@/dictionaries";

import { ProfileForm } from "./profile-form";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <ProfileForm dict={dict} lang={lang} />;
}
