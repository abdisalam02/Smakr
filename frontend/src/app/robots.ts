import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/makr"],
      disallow: [
        "/admin",
        "/admin/",
        "/ad-reel",
        "/boot-lab",
        "/email-preview",
        "/font-lab",
        "/food-icon-studio",
        "/mascot-studio",
        "/studio",
        "/test-icon-picker",
        "/api/",
      ],
    },
  };
}
