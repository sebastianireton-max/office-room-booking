import type { MetadataRoute } from "next";
import { ROOMS } from "@/lib/rooms-data";
import { SITE_URL } from "@/lib/site-config";

// No lastModified or priority: a build timestamp is not a content change, and
// Google ignores priority.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/pricing", "/faq", "/about", "/contact", "/accessibility", "/terms", "/privacy"];
  return [
    ...pages.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...ROOMS.filter((r) => r.active).map((r) => ({
      url: `${SITE_URL}/rooms/${r.id}`,
      images: [`${SITE_URL}/rooms/og/${r.id}.png`],
    })),
  ];
}
