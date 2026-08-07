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
    tagline: "Batch a month of content in one afternoon.",
    marketingDescription:
      "The Loft is built around one idea: momentum. The motorized backdrop wall swaps your set in seconds — pink, green screen, or clean white paper — so you can shoot ten looks without ever breaking flow. Three lit stations mean your whole team can film at once, and the wireless lapel mics keep every take usable straight off the phone.",
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
    tagline: "Your first studio, minus the setup.",
    marketingDescription:
      "One clean white set, two ring lights, and a mic that's already on its stand when you walk in. The Studio strips filming down to the part that matters — you, on camera, without hauling gear or lighting a room from scratch. Ideal when it's just you (or you plus one) and a list of videos to knock out.",
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
      "Four broadcast mics on boom arms, three cameras already framed, and full acoustic treatment on every wall — the Suite is what your show sounds like when the room stops working against you. Walk in, sit down, hit record; leave with multi-cam video and clean audio for up to four hosts, no engineering degree required.",
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
    tagline: "Two chairs, two mics, zero echo.",
    marketingDescription:
      "Sized for exactly what most episodes actually are: two people and a real conversation. The same broadcast mics as the big suite, a camera setup that's already framed for two, and acoustic treatment that keeps small-room echo out of your recording. Book it for an hour, leave with an episode.",
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
      '75" display, AirPlay + HDMI',
      "4K speaker-tracking webcam",
      "Ceiling microphone array",
      "Dedicated fiber Wi-Fi network",
    ],
    active: true,
    tagline: "Walk in prepared. Walk out decided.",
    marketingDescription:
      "Sound-isolated, seats ten, and wired so the technology disappears: a 75-inch display that connects the moment you walk in, a camera that tracks whoever's speaking, and a ceiling mic array that means nobody leans into anything. The Boardroom is for the meetings where the impression matters as much as the agenda.",
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
      '55" display, AirPlay + HDMI',
      "4K webcam",
      "Ceiling microphone",
      "Dedicated fiber Wi-Fi network",
    ],
    active: true,
    tagline: "Small room. Serious signal.",
    marketingDescription:
      "Everything the Boardroom promises, scaled for six: sound isolation, one-tap screen sharing on a 55-inch display, and a ceiling mic that picks up the whole table evenly. The Meeting Room is the fix for taking an important call from a coffee shop — or worse, a car.",
    idealFor: ["Team syncs", "Client calls", "Working sessions", "Interviews"],
  },
];

export function getRoomById(id: string): Room | undefined {
  return ROOMS.find((r) => r.id === id);
}
