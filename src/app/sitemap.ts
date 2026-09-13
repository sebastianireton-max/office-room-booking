import type { MetadataRoute } from "next";
import { ROOMS } from "@/lib/rooms-data";
import { SITE_URL } from "@/lib/site-config";

const BUILT = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [
    ["", 1],
    ["/pricing", 0.8],
    ["/faq", 0.6],
    ["/about", 0.5],
    ["/contact", 0.5],
    ["/accessibility", 0.3],
    ["/terms", 0.3],
    ["/privacy", 0.3],
  ];
  return [
    ...pages.map(([path, priority]) => ({ url: `${SITE_URL}${path}`, lastModified: BUILT, priority })),
    ...ROOMS.filter((r) => r.active).map((r) => ({
      url: `${SITE_URL}/rooms/${r.id}`,
      lastModified: BUILT,
      priority: 0.9,
      images: [`${SITE_URL}/rooms/og/${r.id}.png`],
    })),
  ];
}
