import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";

import { siteConfig } from "@/config/site";
import { title, subtitle } from "@/components/primitives";
import { GithubIcon } from "@/components/icons";
import { getDictionary, type Locale } from "@/dictionaries";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>{dict.home.title1}&nbsp;</span>
        <span className={title({ color: "violet" })}>
          {dict.home.title2}&nbsp;
        </span>
        <br />
        <span className={title()}>{dict.home.title3}</span>
        <div className={subtitle({ class: "mt-4" })}>{dict.home.subtitle}</div>
      </div>

      <div className="flex gap-3">
        <Link
          isExternal
          className={buttonStyles({
            color: "primary",
            radius: "full",
            variant: "shadow",
          })}
          href={siteConfig.links.docs}
        >
          {dict.home.frontendDocs}
        </Link>
        <Link
          isExternal
          className={buttonStyles({ variant: "bordered", radius: "full" })}
          href={siteConfig.links.github}
        >
          <GithubIcon size={20} />
          {dict.home.backendDocs}
        </Link>
      </div>

      <div className="mt-8">
        <Snippet hideCopyButton hideSymbol variant="bordered">
          <span>
            {dict.home.getStarted}{" "}
            <Code color="primary">app/[lang]/page.tsx</Code>
          </span>
        </Snippet>
      </div>
    </section>
  );
}
