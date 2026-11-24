import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/i/", "/profile", "/events/new", "/login", "/register", "/api/"],
    },
  };
}
