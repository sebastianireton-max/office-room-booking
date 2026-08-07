import type { MetadataRoute } from "next";
import { ROOMS } from "@/lib/rooms-data";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = ["", "/pricing", "/faq", "/about", "/contact", "/terms", "/privacy"].map(
    (path) => ({
      url: `${BASE}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.6,
    })
  );

  const roomPages = ROOMS.filter((r) => r.active).map((room) => ({
    url: `${BASE}/rooms/${room.id}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...roomPages];
}
