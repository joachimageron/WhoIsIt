import { getDictionary, type Locale } from "@/dictionaries";

import { ProfileForm } from "./profile-form";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  const lang = langParam as Locale;
  const dict = await getDictionary(lang);

  return <ProfileForm dict={dict} lang={lang} />;
}
