import type { Room } from "@/types/domain";

/**
 * The six placeholder rooms — two Content, two Podcast, two Conference.
 * Matches the design package (Section 5.2) exactly.
 *
 * This is the ONLY place room data is defined. Everything else (filters,
 * badges, cards, seed script) reads from here. Add a seventh room, or a
 * fourth category, by editing this list and ROOM_TYPE_LABELS in
 * src/types/domain.ts — no component or page needs to change.
 */
export const ROOMS: Room[] = [
  {
    id: "content-a",
    name: "The Content Loft",
    type: "content",
    capacity: 4,
    sqft: 300,
    hourlyRateCents: 4500,
    description:
      "Bright, modular content studio built for batch-producing TikTok and Reels content, with a motorized interchangeable backdrop wall.",
    equipment: [
      "Motorized backdrop system (pink / green screen / white paper)",
      "3× ring lights + RGB tube lights",
      "3× smartphone tripod mounts",
      "DJI Mic 2 wireless lapel mic (2-pack)",
    ],
    active: true,
  },
  {
    id: "content-b",
    name: "The Content Studio",
    type: "content",
    capacity: 2,
    sqft: 200,
    hourlyRateCents: 3500,
    description:
      "A compact, single-set content room for solo creators and two-person shoots.",
    equipment: [
      "Fixed muslin backdrop (white)",
      "2× ring lights",
      "1× smartphone tripod mount",
      "1× wireless lapel mic",
    ],
    active: true,
  },
  {
    id: "podcast-a",
    name: "The Podcast Suite",
    type: "podcast",
    capacity: 4,
    sqft: 280,
    hourlyRateCents: 6500,
    description:
      "Full acoustic-treated 4-mic podcast suite for multi-host, multi-camera recording.",
    equipment: [
      "4× Shure SM7B on boom arms",
      "3× Sony FX30 cameras (static multi-cam)",
      "Full acoustic wall treatment",
      "Overhead LED key lights + softboxes",
    ],
    active: true,
  },
  {
    id: "podcast-b",
    name: "The Podcast Studio",
    type: "podcast",
    capacity: 2,
    sqft: 180,
    hourlyRateCents: 5000,
    description:
      "A 2-host podcast studio, acoustically treated and sized for interviews and two-person shows.",
    equipment: [
      "2× Shure SM7B on boom arms",
      "1× static multi-cam setup",
      "Partial acoustic wall treatment",
      "Softbox lighting kit",
    ],
    active: true,
  },
  {
    id: "conference-a",
    name: "The Boardroom",
    type: "conference",
    capacity: 10,
    sqft: 400,
    hourlyRateCents: 7500,
    description:
      "A sound-isolated executive boardroom for client meetings, board sessions, and presentations.",
    equipment: [
      '75" display, AirPlay + HDMI',
      "4K speaker-tracking webcam",
      "Ceiling microphone array",
      "Dedicated fiber Wi-Fi network",
    ],
    active: true,
  },
  {
    id: "conference-b",
    name: "The Meeting Room",
    type: "conference",
    capacity: 6,
    sqft: 250,
    hourlyRateCents: 5500,
    description:
      "A smaller sound-isolated meeting room for team syncs and small-group client calls.",
    equipment: [
      '55" display, AirPlay + HDMI',
      "4K webcam",
      "Ceiling microphone",
      "Dedicated fiber Wi-Fi network",
    ],
    active: true,
  },
];

export function getRoomById(id: string): Room | undefined {
  return ROOMS.find((r) => r.id === id);
}
