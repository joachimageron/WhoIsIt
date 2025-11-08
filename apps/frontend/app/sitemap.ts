import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://whoisit.app";
  const locales = ["en", "fr"];

  // Generate URLs for all locale variants
  const routes = [
    "",
    "/game/create",
    "/game/join",
    "/auth/login",
    "/auth/register",
  ];

  const sitemap: MetadataRoute.Sitemap = [];

  locales.forEach((locale) => {
    routes.forEach((route) => {
      sitemap.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: route === "" ? 1 : 0.8,
      });
    });
  });

  return sitemap;
}
