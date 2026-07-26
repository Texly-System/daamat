import type { MetadataRoute } from "next";
import { getAllRouteSlugs } from "@/lib/content";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const slugs = getAllRouteSlugs();
  return [
    { url: `${SITE.url}/docs`, changeFrequency: "weekly", priority: 1 },
    ...slugs.map((slug) => ({
      url: `${SITE.url}/docs/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    {
      url: `${SITE.url}/docs/package-reference`,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
  ];
}
