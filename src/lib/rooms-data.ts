import type { Room } from "@/types/domain";

/**
 * The room catalog: two Content, two Podcast, two Conference rooms.
 *
 * This is the only place room data is defined; pages, the booking engine and
 * pricing all read from here. Add a room, or a category (with
 * ROOM_TYPE_LABELS in src/types/domain.ts), by editing this list.
 *
 * Marketing copy must stay grounded in each room's equipment list: no claims
 * the listed gear does not back up.
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
      "A modular content studio for batching TikTok and Reels, with a motorized interchangeable backdrop wall.",
    equipment: [
      "Motorized backdrop system (pink / green screen / white paper)",
      "3× ring lights + RGB tube lights",
      "3× smartphone tripod mounts",
      "DJI Mic 2 wireless lapel mic (2-pack)",
    ],
    active: true,
    tagline: "Batch a month of content in one afternoon.",
    marketingDescription:
      "The motorized backdrop wall changes your set between pink, green screen and white paper, so one session can cover several looks. Three ring lights, RGB tube lights and three phone tripod mounts let more than one setup run at once, and a two-pack of DJI Mic 2 wireless lapel mics covers two speakers.",
    idealFor: ["TikTok & Reels batching", "UGC creators", "Product try-ons & hauls", "Small brand shoots"],
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
    tagline: "Your first studio, lights included.",
    marketingDescription:
      "One white muslin backdrop, two ring lights, a phone tripod mount and a wireless lapel mic you clip on, all included in the rate. The Studio is sized for filming on your own or with one other person, without bringing your own lights. Good when you have a list of videos to get through.",
    idealFor: ["Solo creators", "Talking-head video", "Tutorials & how-tos", "Two-person shoots"],
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
    tagline: "Press record. Sound like a network show.",
    marketingDescription:
      "Four Shure SM7B mics on boom arms, three Sony FX30 cameras in a static multi-cam setup, and acoustic treatment on every wall, lit by overhead LED key lights and softboxes. The Suite seats up to four hosts, so a panel or a multi-host show can record audio and video in one session.",
    idealFor: ["Multi-host shows", "Video podcasts", "Interview series", "Panel recordings"],
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
    tagline: "Two chairs, two mics, treated walls.",
    marketingDescription:
      "Sized for two people and a conversation. The same Shure SM7B mics as the Podcast Suite, a static multi-cam setup, partial acoustic wall treatment and a softbox lighting kit. A good fit for interviews, co-hosted episodes and voiceover sessions.",
    idealFor: ["Interview shows", "Co-hosted episodes", "Audio-first podcasts", "Voiceover sessions"],
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
      "75-inch display, AirPlay and HDMI",
      "4K speaker-tracking webcam",
      "Ceiling microphone array",
      "Dedicated fiber Wi-Fi network",
    ],
    active: true,
    tagline: "Walk in prepared. Walk out decided.",
    marketingDescription:
      "Sound-isolated and seats ten: a 75-inch display with AirPlay and HDMI, a 4K webcam that tracks whoever is speaking, and a ceiling microphone array for the table. The Boardroom is for the meetings where the impression matters as much as the agenda.",
    idealFor: ["Client presentations", "Board sessions", "Hybrid meetings", "Workshops & strategy days"],
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
      "55-inch display, AirPlay and HDMI",
      "4K webcam",
      "Ceiling microphone",
      "Dedicated fiber Wi-Fi network",
    ],
    active: true,
    tagline: "Small room. Serious signal.",
    marketingDescription:
      "Sound-isolated and seats six: screen sharing to a 55-inch display over AirPlay or HDMI, a 4K webcam, and a ceiling microphone for the table. The Meeting Room is the fix for taking an important call from a coffee shop, or worse, a car.",
    idealFor: ["Team syncs", "Client calls", "Working sessions", "Interviews"],
  },
];

export function getRoomById(id: string): Room | undefined {
  return ROOMS.find((r) => r.id === id);
}
