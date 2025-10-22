"use client";

import { usePathname } from "next/navigation";
import { Button } from "@heroui/button";
import NextLink from "next/link";

const locales = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
];

export const LanguageSwitcher = ({ currentLang }: { currentLang: string }) => {
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    if (!pathname) return "/";
    const segments = pathname.split("/");

    segments[1] = newLocale;

    return segments.join("/");
  };

  return (
    <div className="flex gap-1">
      {locales.map((locale) => (
        <Button
          key={locale.code}
          as={NextLink}
          className="min-w-unit-12"
          color={currentLang === locale.code ? "primary" : "default"}
          href={switchLocale(locale.code)}
          size="sm"
          variant={currentLang === locale.code ? "solid" : "light"}
        >
          {locale.label}
        </Button>
      ))}
    </div>
  );
};
