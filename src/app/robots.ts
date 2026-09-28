import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ).replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Private or transactional surfaces must stay out of search results.
        disallow: ["/admin", "/api/", "/checkout/", "/campaigns"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
