import { title } from "@/components/primitives";
import { getDictionary, type Locale } from "@/dictionaries";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <div>
      <h1 className={title()}>{dict.about.title}</h1>
    </div>
  );
}
