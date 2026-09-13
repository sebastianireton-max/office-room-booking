import { ImageResponse } from "next/og";
import { ROOMS } from "@/lib/rooms-data";
import { SITE } from "@/lib/site-config";
import { formatUsdPerHour } from "@/lib/format";

export const alt = `${SITE.name}: content, podcast and meeting rooms by the hour`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  const from = formatUsdPerHour(Math.min(...ROOMS.filter((r) => r.active).map((r) => r.hourlyRateCents)));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#f7f1e6", padding: 72, color: "#221e1a" }}>
        <div style={{ fontSize: 36, display: "flex" }}>
          clock<b>ROOM</b>
        </div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 112, lineHeight: 0.95, letterSpacing: -4 }}>
          <span>show up. clock in.</span>
          <b style={{ color: "#0f766e" }}>CREATE.</b>
        </div>
        <div style={{ fontSize: 32, color: "#6b6259", display: "flex" }}>
          Content, podcast and meeting rooms · by the hour · from {from}
        </div>
      </div>
    ),
    size
  );
}
