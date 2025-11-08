import "server-only";

import type { Dictionary } from "./types";

const dictionaries = {
  en: () => import("./en.json").then((module) => module.default as Dictionary),
  fr: () => import("./fr.json").then((module) => module.default as Dictionary),
};

export type Locale = "en" | "fr";
export type { Dictionary };

export const getDictionary = async (locale: Locale): Promise<Dictionary> =>
  dictionaries[locale]?.() ?? dictionaries.en();
