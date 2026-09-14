import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://togetherforever.id";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/invitation", "/i/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
