"use client";

import { usePathname, useRouter } from "next/navigation";
import { Select, SelectItem } from "@heroui/select";
import { ChangeEventHandler } from "react";

const locales = ["en", "fr"];

export const LanguageSwitcher = ({ currentLang }: { currentLang: string }) => {
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale: ChangeEventHandler<HTMLSelectElement> = (e) => {
    if (!e || typeof e !== "object" || !("target" in e)) return;
    if (!pathname) return;
    const segments = pathname.split("/");

    segments[1] = e.target.value;

    router.push(segments.join("/"));
  };

  return (
    <div className="flex gap-1">
      <Select
        className="w-18"
        selectedKeys={[currentLang]}
        variant="bordered"
        onChange={switchLocale}
      >
        {locales.map((local) => (
          <SelectItem key={local}>{local}</SelectItem>
        ))}
      </Select>
    </div>
  );
};
