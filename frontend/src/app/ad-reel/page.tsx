"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  ArrowUpRight,
  Bookmark,
  Check,
  ChevronDown,
  Compass,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Globe,
  LocateFixed,
  MapPin,
  Maximize2,
  Music,
  Navigation,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Send,
  Share2,
  Smartphone,
  Sparkles,
  Star,
  ThumbsUp,
  Utensils,
  Upload,
  Video,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { SmakrMascotRig } from "@/components/studio/SmakrMascotRig";
import { FOOD_PIN_SVG_MAP } from "@/components/food/FoodIcons";
import SmakrLogo from "@/components/ui/SmakrLogo";
import { OfficialSmakrMascot, OFFICIAL_SMAKR_MASCOT_CONFIG } from "@/lib/officialSmakrMascot";
import { buildMascotSVGString } from "@/components/avatar/MascotCharacter";
import {
  buildOpenPeepsSvg,
  getOrCreateGuestOpenPeepsConfig,
} from "@/lib/onboardingAvatar";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { useSyncAppData } from "@/hooks/useSyncAppData";

if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
}

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || "ThoacZP1opK329U6AvTz";
const MAP_STYLE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
  : "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

interface AdAudioTrack {
  id: string;
  name: string;
  genre: string;
  src: string;
  desc: string;
}

const AD_AUDIO_TRACKS: AdAudioTrack[] = [
  {
    id: "chill",
    name: "Chill Lo-Fi Beat",
    genre: "Chillhop",
    src: "/audio/chill-beat.mp3",
    desc: "Warm head-nodding lo-fi rhythm with Rhodes keys",
  },
  {
    id: "jazz",
    name: "Smooth Jazz Hop",
    genre: "Jazz Lounge",
    src: "/audio/jazz-groove.mp3",
    desc: "Upright acoustic bass, cafe keys & relaxed snare",
  },
  {
    id: "upbeat",
    name: "Upbeat Commercial",
    genre: "Modern Pop",
    src: "/audio/upbeat-ad.mp3",
    desc: "Catchy energetic commercial bounce for high-engagement reels",
  },
  {
    id: "happy",
    name: "Happy Food Vlog",
    genre: "Acoustic Foodie",
    src: "/audio/happy-vibe.mp3",
    desc: "Sunny, playful acoustic groove matching Oslo foodies",
  },
  {
    id: "recipe",
    name: "Kitchen Recipe Groove",
    genre: "Cooking Vibe",
    src: "/audio/recipe-groove.mp3",
    desc: "Jaunty upbeat foodie rhythm with crisp kitchen bounce",
  },
  {
    id: "city",
    name: "Urban City Energy",
    genre: "City Pulse",
    src: "/audio/city-pulse.mp3",
    desc: "Driving modern beat with young Oslo street pulse",
  },
  {
    id: "bubbly",
    name: "Playful Bubbly Pop",
    genre: "Cute / Fun",
    src: "/audio/bubbly-pop.mp3",
    desc: "Lighthearted, cheerful cartoon bounce for food adventures",
  },
  {
    id: "fresh",
    name: "Fresh Finds Beat",
    genre: "Discovery",
    src: "/audio/fresh-finds.mp3",
    desc: "Bright exploration pop for uncovering hidden culinary gems",
  },
  {
    id: "sunset",
    name: "Golden Hour Stroll",
    genre: "Sunset Soul",
    src: "/audio/sunset-stroll.mp3",
    desc: "Relaxed, warm soul groove for evening dining and drinks",
  },
  {
    id: "cafe",
    name: "Oslo Bakery Piano",
    genre: "Nordic Cafe",
    src: "/audio/cafe-keys.mp3",
    desc: "Gentle acoustic jazz chords & mellow morning pastry vibe",
  },
  {
    id: "none",
    name: "Mute (Silent Video)",
    genre: "Silent",
    src: "",
    desc: "Export clean video with no background track",
  },
];

const TOTAL_DURATION = 31.5;
// Exact real-world coordinates of Ochaya - The Matcha from Supabase
const OCHAYA_LNGLAT: [number, number] = [10.7525, 59.9159];

// Logical iPhone 16 Pro viewport dimensions (never stretched!)
const PHONE_LOGICAL_W = 393;
const PHONE_LOGICAL_H = 852;

type AspectMode = "9:16" | "16:9";
type PlaybackSpeed = 0.5 | 0.75 | 1 | 1.25;
type MascotRigPoseId = "pointing-up" | "jacket-2" | "shrug" | "coffee";

interface SceneMeta {
  id: number;
  code: string;
  label: string;
  start: number;
  end: number;
  pose: MascotRigPoseId;
  face: string;
  badge: string;
  speech: string;
  subtext: string;
}

const SCENES: SceneMeta[] = [
  {
    id: 0,
    code: "S0",
    label: "Hook: Hungry in Oslo?",
    start: 0.0,
    end: 3.5,
    pose: "shrug",
    face: "eating-happy",
    badge: "✦ HUNGRY IN OSLO?",
    speech: "Hungry in Oslo but have NO clue where to eat? 🤔",
    subtext: "Stop scrolling Google Maps for 45 minutes.",
  },
  {
    id: 1,
    code: "S1",
    label: "Open Feed",
    start: 3.5,
    end: 7.0,
    pose: "pointing-up",
    face: "smile",
    badge: "✦ OSLO FOOD RADAR",
    speech: "Browse the best food spots around Oslo 👀",
    subtext: "Live Oslo feed of dishes actually worth trying",
  },
  {
    id: 2,
    code: "S2",
    label: "Scroll & Pick Dish",
    start: 7.0,
    end: 11.0,
    pose: "jacket-2",
    face: "eating-happy",
    badge: "✦ DISH FEED",
    speech: "See real dishes, honest verdicts, and exact prices 🍽️",
    subtext: "Biscoff Matcha (78 kr) at Ochaya Sentrum",
  },
  {
    id: 3,
    code: "S3",
    label: "Fly to Map Pin",
    start: 11.0,
    end: 14.5,
    pose: "pointing-up",
    face: "cheeky",
    badge: "✦ 1-TAP MAP VIEW",
    speech: "Tap any dish and the map flies straight to the spot 📍",
    subtext: "Walking distance, directions, and opening hours",
  },
  {
    id: 4,
    code: "S4",
    label: "Spot Verdict Card",
    start: 14.5,
    end: 18.0,
    pose: "shrug",
    face: "loving-grin",
    badge: "✦ SPOT VERDICT",
    speech: "4.9★ rating, 350m walk, and open right now 🍵",
    subtext: "Ochaya · Matcha & Japanese Tea House · Sentrum",
  },
  {
    id: 5,
    code: "S5",
    label: "Menu & Weekly Pick",
    start: 18.0,
    end: 24.0,
    pose: "coffee",
    face: "eating-happy",
    badge: "✦ WEEKLY DROP",
    speech: "Full menu breakdown, plus our weekly spotlight dish 🥥",
    subtext: "This week: Coconut Coffee at Em Oi! (79 kr)",
  },
  {
    id: 6,
    code: "S6",
    label: "Beta Closer & Invite",
    start: 24.0,
    end: 31.5,
    pose: "pointing-up",
    face: "smile-big",
    badge: "✦ JOIN THE BETA",
    speech: "Want early access? Comment 'BETA' for the link 🚀",
    subtext: "smakr.no · Oslo's live food radar",
  },
];

interface AdDishItem {
  id: string;
  spotId: string;
  dishName: string;
  spotName: string;
  neighborhood: string;
  address: string;
  walkTime: string;
  priceNok: number;
  rating: string;
  verdict: string;
  imageUrl: string;
  category: string;
  likes: number;
  lngLat: [number, number];
}

/**
 * Authentic Oslo dishes & places pulled directly from the Smakr webapp database
 * (Zero fake stock photos, zero invented prices).
 */
const CURATED_AD_DISHES: AdDishItem[] = [
  {
    id: "ad-dish-daglig",
    spotId: "spot-daglig",
    dishName: "Warm Cardamom Boller",
    spotName: "Daglig Brød",
    neighborhood: "Bjørvika",
    address: "Alnafetgata 1B, 0192 Oslo",
    walkTime: "5 min",
    priceNok: 135,
    rating: "4.7",
    verdict:
      "Golden, pillowy artisan sourdough boller warm from the hearth with coarse freshly ground green cardamom.",
    imageUrl:
      "/api/places/photos?ref=places%2FChIJASAuJO1vQUYRb8PaolnwQnQ%2Fphotos%2FAa-ngMZKzMaVTb1MCG24N1ECOGBcc009PoR-AMPaMEll53_14w5TV94gIDDFh_xa5d-HzI501c1wLh4M3PLwmpucZEzPrwoh0V1ZG_COCrvs2bx1PWBqn_JhDiZI021S3mehE-5_tb2QfwCr6MgSnq8E4us95ynRojuFmVAdU7zGFBuaetwhgjdNAT95LQPizHFfJhUvFE2KTt5ds5JPAh5ZjCKddkeKbKfxH92CyCve8s7oFgSR5opXo4uJxvBHQDs2lyBkZx_AjZLhf2fQkyAQQDKc16W231wVQk3HY6YGKs2hdfUR7cepSLurmEdUNC7dm--o-IzpLkATt7CJmpF_rrA9IUmmpSax7brF-IDcV7XuJrK6LCROdWa50jTbxQ-MfMtZJa4ybvyjAuD_hd8taev0dvv0oMsM9yt9Do1NJTcyQg&i=1&w=600",
    category: "bakery",
    likes: 42,
    lngLat: [10.772, 59.9024],
  },
  {
    id: "ad-dish-laizai",
    spotId: "spot-laizai",
    dishName: "Bánh Mì Sa Tế",
    spotName: "Lai Zai - Viet Street Food",
    neighborhood: "Grünerløkka",
    address: "Thorvald Meyers gate 83A, 0552 Oslo",
    walkTime: "4 min",
    priceNok: 130,
    rating: "4.8",
    verdict:
      "Signature crispy baguette packed with caramelized lemongrass pork, fresh herbs, crunchy pickled daikon and chili sa tế.",
    imageUrl:
      "/api/places/photos?ref=places%2FChIJH-ke3YJvQUYRfkFUWacAGoY%2Fphotos%2FAa-ngMbPKw_0mCpujVCuwS-FrYhGoWqRJrelehnoXxHvDLNz3VSlu65b9hLx27ctMaFJrNJMSGBKQ9bgJMQG3bTE8D0Audv5qrQ4VCc50CCA19tSpk0GFtEtC8Zbkze4NWE1b9KmS1fIBbM5H0BQsxuxtfZAkUXuPXPs0-z9N5AYLdeyx36ZjJpOdvkSzuJYeG3QpUDcN1291rcBgojnjm-hgs7PSyL6xNzdsGcUsj6tKaaF-OngiuavYGo3ggGxoBa_rTW4EO6FgttX1epMo4Q74rEFMvWRH4WiAxx3zBDEfCT3uvrWaNbbDAU-1IolVD7q8_7p8JND-e4REqP8a8u3t4_XeWkl5NtPny_vAjFwActeuxRtzjLG9Sip9dUi4gODClAnOTBoBI-n7J21PQqICZFvWNqkJkj99CK9y3fG-p8X&i=1&w=600",
    category: "street_food",
    likes: 64,
    lngLat: [10.7591, 59.9198],
  },
  {
    id: "ad-dish-matcha",
    spotId: "spot-ochaya",
    dishName: "Biscoff Matcha",
    spotName: "Ochaya - The Matcha",
    neighborhood: "Sentrum",
    address: "Bernt Ankers gate 6a, 0183 Oslo",
    walkTime: "3 min",
    priceNok: 78,
    rating: "4.9",
    verdict:
      "First-harvest ceremonial Uji matcha whipped over creamy oat milk with rich Biscoff cookie-butter swirl.",
    imageUrl:
      "/api/places/photos?ref=places%2FChIJ6a-l059vQUYRpmfUn8lBiKA%2Fphotos%2FAa-ngMb5jdA9s_Kz4rz5zlQKUtqhZTlNbmOSPHgTKokqc39u3XPLSNypN9Kw-6WdPhi09egb7qpKqUDSavhcoypNACCcxtPeHUpVponlNX5TLi250nOuXAg34v0TNyCllm_40jKWIeSiBYTKwJmFpvNgCjj6Avkw1YHKAFLPYoNfiHO3vmjxrKWzetGgZs7ZHgLTXpVfszY94vi6aDtAgNRZqOaQlry_e9ibgiKPfa7tDPXQ6j7G-052EIVHtOe9EImM6v5m_Lox_jF4sojFDSS8RMSdyOUXRjAvIIFB2mdnPFjr2bRlJmzt6zj3D0FYTS5vZzQrw37uSsqat5jxCzsYG4MrnCOEjFWDsKQAhPNVdquwV2CbKugMNHihOy10490nbwRp_h14-G6tHXsEKTrslFIX2s_wDTFZLEL656wdzYOHmQ&i=6&w=600",
    category: "matcha",
    likes: 89,
    lngLat: [10.7525, 59.9159],
  },
  {
    id: "ad-dish-pizza",
    spotId: "spot-diggpizza",
    dishName: "Cheddar Pizza",
    spotName: "Digg Pizza - Grønland",
    neighborhood: "Bjørvika",
    address: "Grønlandsleiret 1, 0190 Oslo",
    walkTime: "4 min",
    priceNok: 148,
    rating: "4.9",
    verdict:
      "Wood-fired blistered sourdough crust with sharp aged cheddar, creamy fior di latte, and house herb drizzle.",
    imageUrl:
      "/api/places/photos?ref=places%2FChIJHXFYxnBvQUYROKS0urs7W1I%2Fphotos%2FAa-ngMaP7_K30SzA2Y7fBAC3VUFwmh2VxHK0HCkULcM8O7sbBBbQM-gN1qG2gXlPNKg2B_dpRFhVcy49Evt3LNwah4SSy9FOz5hSSw793dJVy5M7r1pJIBS6jVG-u1j_XOp1ScrD8WBoEAr19VpCEL07S0yE0R1mJD8A4JZ5Arsuwug65EqgRyl-lfmVYiyYB9IUBEevqz4KyOGYwiuS-W1AvFQ7tvfIyP50B7pJzPFQqQ06QSgv3XQPw3ofDzFMXT9vhs1oh-aXe43QHZYjxtPAbdgUHYZokdq_pP9yHH4X4Nz9IrCFOpAz8YmfWSuxKV1cEyjWxNL0jdFXv86L4DtvEITgsopNuX150Az0oFGeIhvCFaFC-ks6OOKgTAouR5pKygreG9o5HO1Za_06N0a4c82CjjNPvsJrLFH949g_ct-XYw&i=1&w=600",
    category: "pizza",
    likes: 76,
    lngLat: [10.7629, 59.9126],
  },
  {
    id: "ad-dish-kfried",
    spotId: "spot-kfried",
    dishName: "Korean Fried Chicken",
    spotName: "175°C K-fried",
    neighborhood: "Vulkan",
    address: "Vulkan, 0178 Oslo",
    walkTime: "6 min",
    priceNok: 159,
    rating: "4.8",
    verdict:
      "Ultra-crispy double-fried boneless tenders tossed in sticky honey-gochujang glaze with pickled daikon.",
    imageUrl:
      "/api/places/photos?ref=places%2FChIJJwhg5EN9QUYRXTea2gCDJq8%2Fphotos%2FAa-ngMYx5akrnmIXrQFW9NzDoJhpAABYdArN0QXHRqDMNTdY9ZhIg6nzzwf5zMQtFQeLLAdj15l1cjZqCvm4UlcSLc8FXkV_2Lr9dOWGBKL61P5FyQ1aZNCxpduZVHL7odozKFJ5hSyWY5yOGvE98zV5XBKaEGCx1qoBhekAqMB5KUI5k2NWOc8uOos3Loze3BrM5hcWlKtkOQwHtw3iBH6jh_1_iKqt7vujjF1i747LdPMcw4cvtshovBijaxFM16HeUqfCjXFYqHETKAWxLcgWjf-mIgFlvDf5JEvI0KSkjG9kgwG0YwLnzW86Ywq9YvzQYFDsyzas1Qud7BxlnzRriHmHrH0-ZngkQaMBy9TJMeZJaS-kx3lRzQQ7V0JmYdxuvRKVT8G-KaYV4f6wGgO_cEakzcbNgIXJQlVP8iTxED2_ag&i=2&w=600",
    category: "fried_chicken",
    likes: 82,
    lngLat: [10.7519, 59.9225],
  },
];

interface OsloMapPinDef {
  id: string;
  name: string;
  shortLabel: string;
  price: string;
  category: string;
  lngLat: [number, number];
  isTarget?: boolean;
  isWeeklyPick?: boolean;
}

const OSLO_RADAR_PINS: OsloMapPinDef[] = [
  {
    id: "spot-ochaya",
    name: "Ochaya - The Matcha",
    shortLabel: "Ochaya · 78 kr",
    price: "78 kr",
    category: "matcha",
    lngLat: [10.7525, 59.9159],
    isTarget: true,
  },
  {
    id: "spot-weekly-pick",
    name: "Em Oi! · Smakr Pick",
    shortLabel: "✦ Smakr Pick",
    price: "79 kr",
    category: "street_food",
    lngLat: [10.7572, 59.9138],
    isWeeklyPick: true,
  },
  {
    id: "spot-daglig",
    name: "Daglig Brød",
    shortLabel: "Daglig Brød · 135 kr",
    price: "135 kr",
    category: "bakery",
    lngLat: [10.772, 59.9024],
  },
  {
    id: "spot-laizai",
    name: "Lai Zai Viet",
    shortLabel: "Lai Zai · 130 kr",
    price: "130 kr",
    category: "street_food",
    lngLat: [10.7591, 59.9198],
  },
  {
    id: "spot-diggpizza",
    name: "Digg Pizza",
    shortLabel: "Digg Pizza · 148 kr",
    price: "148 kr",
    category: "pizza",
    lngLat: [10.7629, 59.9126],
  },
  {
    id: "spot-kfried",
    name: "175°C K-fried",
    shortLabel: "175°C · 159 kr",
    price: "159 kr",
    category: "fried_chicken",
    lngLat: [10.7519, 59.9225],
  },
];

export interface OchayaVenueDish {
  id: string;
  name: string;
  priceNok: number;
  rating: string;
  review: string;
  tags: string[];
  image: string;
  isCraving: boolean;
}

/**
 * Authentic Ochaya dishes and verified Google Places reviews straight from Smakr's database
 */
const OCHAYA_VENUE_DISHES: OchayaVenueDish[] = [
  {
    id: "ochaya-d1",
    name: "Biscoff Matcha",
    priceNok: 78,
    rating: "4.9",
    review:
      "Best matcha I have had in a while. If you love matcha, please go here. It is worth every penny.",
    tags: ["Ceremonial Uji", "Biscoff Swirl", "Oat Milk"],
    image:
      "/api/places/photos?ref=places%2FChIJ6a-l059vQUYRpmfUn8lBiKA%2Fphotos%2FAa-ngMb5jdA9s_Kz4rz5zlQKUtqhZTlNbmOSPHgTKokqc39u3XPLSNypN9Kw-6WdPhi09egb7qpKqUDSavhcoypNACCcxtPeHUpVponlNX5TLi250nOuXAg34v0TNyCllm_40jKWIeSiBYTKwJmFpvNgCjj6Avkw1YHKAFLPYoNfiHO3vmjxrKWzetGgZs7ZHgLTXpVfszY94vi6aDtAgNRZqOaQlry_e9ibgiKPfa7tDPXQ6j7G-052EIVHtOe9EImM6v5m_Lox_jF4sojFDSS8RMSdyOUXRjAvIIFB2mdnPFjr2bRlJmzt6zj3D0FYTS5vZzQrw37uSsqat5jxCzsYG4MrnCOEjFWDsKQAhPNVdquwV2CbKugMNHihOy10490nbwRp_h14-G6tHXsEKTrslFIX2s_wDTFZLEL656wdzYOHmQ&i=6&w=600",
    isCraving: true,
  },
  {
    id: "ochaya-d2",
    name: "Strawberry Iced Matcha",
    priceNok: 88,
    rating: "4.9",
    review:
      "Bright green colour and dense consistency. The strawberry compote and cold-whisked green tea foam blend together so well.",
    tags: ["Muddled Berry", "Kyoto Foam", "Iced"],
    image:
      "/api/places/photos?ref=places%2FChIJ6a-l059vQUYRpmfUn8lBiKA%2Fphotos%2FAa-ngMae_VRJ02FUheDoIEHZ-GKvVg2EIo2Wt8XyOQZkyvHjKwNJ-XUS-oBSHzk7NRql3e75b_spwFJNoGBpHFf7sMcDiUWu5ZEWZ2dkJlm_vNIy0tgy4XO9ATH4MCCq12r_zjNDFaRtL6TzyEJVw63wwcT9PFsv-_NI8pY15n4rAOmMySjd8XUbhunSCpPOkufMP2afgE8RF-9LPsWgCnY5O-uweAfjrI5qq1Lwcsa4L1RxS2oUoRDMQGWrTHVdudsLod_8if_nQwaFVtILqG1zi0bX8BUGc6AGVh-D-shiDsKToRodwVzO45OjhPOSyxWCxBgOPyxtd_MzEwOjZMLhqamQdjkXRLEtMjO9ikXNOFjv4wGDeDb7BVg_MYpASRk5k2nKuRkoNe7Fv0lGzc7cK4GktmiMv275qCS4hJK-jZ1B5g&i=0&w=600",
    isCraving: false,
  },
  {
    id: "ochaya-d3",
    name: "Roasted Hojicha Latte",
    priceNok: 78,
    rating: "4.8",
    review:
      "The milk to hojicha ratio was quite perfect. Charcoal-roasted Kyoto tea with deep toasty hazelnut aroma.",
    tags: ["Hojicha", "Charcoal Roasted", "Kyoto"],
    image:
      "/api/places/photos?ref=places%2FChIJ6a-l059vQUYRpmfUn8lBiKA%2Fphotos%2FAa-ngMb5jdA9s_Kz4rz5zlQKUtqhZTlNbmOSPHgTKokqc39u3XPLSNypN9Kw-6WdPhi09egb7qpKqUDSavhcoypNACCcxtPeHUpVponlNX5TLi250nOuXAg34v0TNyCllm_40jKWIeSiBYTKwJmFpvNgCjj6Avkw1YHKAFLPYoNfiHO3vmjxrKWzetGgZs7ZHgLTXpVfszY94vi6aDtAgNRZqOaQlry_e9ibgiKPfa7tDPXQ6j7G-052EIVHtOe9EImM6v5m_Lox_jF4sojFDSS8RMSdyOUXRjAvIIFB2mdnPFjr2bRlJmzt6zj3D0FYTS5vZzQrw37uSsqat5jxCzsYG4MrnCOEjFWDsKQAhPNVdquwV2CbKugMNHihOy10490nbwRp_h14-G6tHXsEKTrslFIX2s_wDTFZLEL656wdzYOHmQ&i=6&w=600",
    isCraving: false,
  },
];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function easeInOutCubic(t: number) {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutCubic(t: number) {
  const x = clamp(t, 0, 1);
  return 1 - Math.pow(1 - x, 3);
}

/**
 * Quintic easing (5th-degree polynomial):
 * Delivers ultra-smooth acceleration and whisper-quiet deceleration
 * with continuous 2nd derivatives (zero jerk) matching Apple CoreAnimation & GSAP power4.
 */
function easeOutQuint(t: number) {
  const x = clamp(t, 0, 1);
  return 1 - Math.pow(1 - x, 5);
}

function easeInOutQuint(t: number) {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 16 * Math.pow(x, 5) : 1 - Math.pow(-2 * x + 2, 5) / 2;
}

/**
 * Apple-grade modal spring-like ease approximation of cubic-bezier(0.16, 1, 0.3, 1)
 */
function easeAppleSmooth(t: number) {
  const x = clamp(t, 0, 1);
  return 1 - Math.pow(1 - x, 4);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * clamp(t, 0, 1);
}

/**
 * Builds the real MapLibre DOM marker element matching `MapRadarView.tsx`.
 */
function createRadarPinElement(pin: OsloMapPinDef): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "select-none pointer-events-none";
  root.dataset.pinId = pin.id;

  if (pin.isWeeklyPick) {
    // Official ✦ Smakr Pick mascot medallion pin
    const wrapper = document.createElement("div");
    wrapper.className =
      "pin-visual relative flex flex-col items-center transition-transform duration-300";
    const badge = document.createElement("div");
    badge.style.cssText =
      "background:#E84A27;color:#FFFFFF;font-size:9px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;padding:2px 7px;border-radius:999px;box-shadow:0 3px 10px rgba(232,74,39,0.45);border:1.5px solid #FFFFFF;margin-bottom:2px;white-space:nowrap;";
    badge.textContent = "✦ Smakr Pick";

    const puck = document.createElement("div");
    puck.style.cssText =
      "width:42px;height:42px;border-radius:999px;background:#FAF7F2;border:2.5px solid #E84A27;box-shadow:0 6px 18px rgba(232,74,39,0.38);overflow:hidden;display:flex;align-items:center;justify-content:center;";
    puck.innerHTML = buildMascotSVGString(OFFICIAL_SMAKR_MASCOT_CONFIG, false, 38, 38);

    const arrow = document.createElement("div");
    arrow.style.cssText =
      "width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid #E84A27;margin-top:-1px;";

    wrapper.appendChild(badge);
    wrapper.appendChild(puck);
    wrapper.appendChild(arrow);
    root.appendChild(wrapper);
    return root;
  }

  // Standard frosted porcelain puck matching MapRadarView.tsx
  const wrapper = document.createElement("div");
  wrapper.className =
    "pin-visual relative flex flex-col items-center transition-transform duration-300";

  const puck = document.createElement("div");
  puck.className = "smakr-map-puck";
  puck.style.cssText =
    "width:38px;height:38px;border-radius:999px;background:rgba(255,252,247,0.86);backdrop-filter:blur(8px);border:1.5px solid rgba(255,255,255,0.95);box-shadow:0 4px 12px rgba(24,22,21,0.16);display:grid;place-items:center;transition:all 0.25s ease;";

  const iconBox = document.createElement("div");
  iconBox.style.cssText = "width:22px;height:22px;display:grid;place-items:center;";
  iconBox.innerHTML =
    FOOD_PIN_SVG_MAP[pin.category] ?? FOOD_PIN_SVG_MAP.street_food ?? "🍴";
  const svgEl = iconBox.querySelector("svg");
  if (svgEl) {
    svgEl.style.width = "21px";
    svgEl.style.height = "21px";
    svgEl.style.display = "block";
  }
  puck.appendChild(iconBox);

  const arrow = document.createElement("div");
  arrow.className = "smakr-puck-arrow";
  arrow.style.cssText =
    "width:0;height:0;border-left:4.5px solid transparent;border-right:4.5px solid transparent;border-top:5.5px solid rgba(24,22,21,0.55);margin-top:-1px;";

  const label = document.createElement("div");
  label.className = "smakr-puck-label";
  label.style.cssText =
    "margin-top:3px;padding:1.5px 7px;border-radius:999px;background:rgba(250,247,242,0.92);backdrop-filter:blur(6px);border:1px solid rgba(24,22,21,0.08);box-shadow:0 2px 6px rgba(24,22,21,0.10);font-size:9.5px;font-weight:800;color:#181615;white-space:nowrap;";
  label.textContent = pin.shortLabel;

  wrapper.appendChild(puck);
  wrapper.appendChild(arrow);
  wrapper.appendChild(label);
  root.appendChild(wrapper);
  return root;
}

/**
 * Builds the `● YOU` Open Peeps Bust sticker + emerald radar dot from `MapRadarView.tsx`.
 */
function createYouBustMarkerElement(): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "select-none pointer-events-none z-30";

  const container = document.createElement("div");
  container.className = "relative flex flex-col items-center";

  const charContainer = document.createElement("div");
  charContainer.style.cssText =
    "width:48px;height:54px;display:flex;align-items:flex-end;justify-content:center;filter:drop-shadow(2px 0 0 #FFFFFF) drop-shadow(-2px 0 0 #FFFFFF) drop-shadow(0 2px 0 #FFFFFF) drop-shadow(0 -2px 0 #FFFFFF) drop-shadow(0 4px 10px rgba(0,0,0,0.22));";
  charContainer.innerHTML = buildOpenPeepsSvg(getOrCreateGuestOpenPeepsConfig());
  const svgEl = charContainer.querySelector("svg");
  if (svgEl) {
    svgEl.style.width = "100%";
    svgEl.style.height = "100%";
    svgEl.style.display = "block";
  }

  const badge = document.createElement("div");
  badge.style.cssText =
    "margin-top:-6px;position:relative;z-index:20;background:rgba(250,247,242,0.95);color:#181615;font-weight:800;font-size:8px;letter-spacing:0.08em;text-transform:uppercase;padding:2px 6px;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,0.15);border:1px solid rgba(16,185,129,0.5);display:flex;align-items:center;gap:3px;";
  badge.innerHTML = `<span style="width:5px;height:5px;border-radius:999px;background:#10B981;box-shadow:0 0 6px #10B981;display:inline-block;"></span><span>YOU</span>`;

  const dot = document.createElement("div");
  dot.style.cssText =
    "margin-top:2px;width:9px;height:9px;border-radius:999px;background:#10B981;border:2px solid #FFFFFF;box-shadow:0 0 10px #10B981;";

  container.appendChild(charContainer);
  container.appendChild(badge);
  container.appendChild(dot);
  root.appendChild(container);
  return root;
}

export default function AdReelStagePage() {
  // Hydrate real app data if available so actual dishes/venues seamlessly enrich the stage
  useSyncAppData(true);
  const storePosts = useCityPulseStore((s) => s.foodPosts);
  const weeklyPick = useCityPulseStore((s) => s.weeklyPick);

  const [aspectMode, setAspectMode] = useState<AspectMode>("9:16");
  const [isPlaying, setIsPlaying] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.has("t")) return false;
    }
    return true;
  });
  const [speed, setSpeed] = useState<PlaybackSpeed>(1);
  const [timelineSec, setTimelineSec] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const t = p.get("t");
      if (t !== null && !isNaN(parseFloat(t))) return parseFloat(t);
    }
    return 0;
  });
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [isRecordMode, setIsRecordMode] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [stageScale, setStageScale] = useState(0.45);
  const [isDownloading, setIsDownloading] = useState(false);

  // Audio Soundtrack & SFX state
  const [selectedTrackId, setSelectedTrackId] = useState<string>("chill");
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(0.75);
  const [enableSfx, setEnableSfx] = useState<boolean>(true);
  const [showAudioMenu, setShowAudioMenu] = useState<boolean>(false);

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const sfxGainRef = useRef<GainNode | null>(null);
  const lastTriggeredSfxRef = useRef<Record<string, number>>({});

  const [customTrack, setCustomTrack] = useState<AdAudioTrack | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const allTracks = useMemo(() => {
    if (customTrack) return [customTrack, ...AD_AUDIO_TRACKS];
    return AD_AUDIO_TRACKS;
  }, [customTrack]);

  const activeTrack = useMemo(
    () => allTracks.find((t) => t.id === selectedTrackId) || allTracks[0],
    [allTracks, selectedTrackId]
  );

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const newTrack: AdAudioTrack = {
      id: "custom",
      name: file.name.replace(/\.[^/.]+$/, "").slice(0, 24),
      genre: "Custom Audio",
      src: url,
      desc: "User uploaded audio track",
    };
    setCustomTrack(newTrack);
    setSelectedTrackId("custom");
    setIsAudioMuted(false);
    initAudioContext();
  };

  // Initialize / resume Web Audio Graph (mixed directly into speaker output and MediaRecorder stream)
  const initAudioContext = () => {
    if (typeof window === "undefined") return null;
    if (!audioCtxRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const dest = ctx.createMediaStreamDestination();
      const musicGain = ctx.createGain();
      const sfxGain = ctx.createGain();

      musicGain.gain.value = isAudioMuted ? 0 : audioVolume;
      sfxGain.gain.value = enableSfx ? 0.75 : 0;

      musicGain.connect(dest);
      musicGain.connect(ctx.destination);

      sfxGain.connect(dest);
      sfxGain.connect(ctx.destination);

      audioCtxRef.current = ctx;
      audioDestRef.current = dest;
      musicGainRef.current = musicGain;
      sfxGainRef.current = sfxGain;
    }

    if (audioElRef.current && audioCtxRef.current && musicGainRef.current && !sourceNodeRef.current) {
      try {
        const src = audioCtxRef.current.createMediaElementSource(audioElRef.current);
        src.connect(musicGainRef.current);
        sourceNodeRef.current = src;
      } catch (e) {
        console.warn("Audio element source connect notice:", e);
      }
    }

    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Play realistic graphite pencil friction scratch sound (at 15.28s)
  const triggerPencilScratch = () => {
    const ctx = initAudioContext();
    if (!ctx || !sfxGainRef.current || !enableSfx) return;
    try {
      const bufferSize = Math.floor(ctx.sampleRate * 0.30);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const stroke = Math.sin(i / 14) * 0.5 + 0.5;
        data[i] = (Math.random() * 2 - 1) * stroke * (1 - i / bufferSize);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 2600;
      filter.Q.value = 2.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.38, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.29);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(sfxGainRef.current);
      noise.start();
    } catch (e) {
      console.warn("SFX scratch error:", e);
    }
  };

  // Play friendly wooden / tactile bubble pop sound on taps
  const triggerPop = (freq = 620) => {
    const ctx = initAudioContext();
    if (!ctx || !sfxGainRef.current || !enableSfx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.8, ctx.currentTime + 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.4, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.28, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(sfxGainRef.current);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch (e) {
      console.warn("SFX pop error:", e);
    }
  };

  // Play gentle whoosh sound on scene transitions
  const triggerWhoosh = () => {
    const ctx = initAudioContext();
    if (!ctx || !sfxGainRef.current || !enableSfx) return;
    try {
      const bufferSize = Math.floor(ctx.sampleRate * 0.26);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((Math.PI * i) / bufferSize);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(320, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1300, ctx.currentTime + 0.13);
      filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.26);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.26);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(sfxGainRef.current);
      noise.start();
    } catch (e) {
      console.warn("SFX whoosh error:", e);
    }
  };

  // Synchronize audio track volume and gain node
  useEffect(() => {
    const el = audioElRef.current;
    if (el) {
      el.volume = isAudioMuted ? 0 : audioVolume;
    }
    if (musicGainRef.current) {
      musicGainRef.current.gain.value = isAudioMuted ? 0 : audioVolume;
    }
    if (sfxGainRef.current) {
      sfxGainRef.current.gain.value = enableSfx ? 0.75 : 0;
    }
  }, [isAudioMuted, audioVolume, enableSfx]);

  // Synchronize soundtrack playback with timeline loop
  useEffect(() => {
    const el = audioElRef.current;
    if (!el) return;
    if (selectedTrackId === "none" || !activeTrack.src) {
      el.pause();
      return;
    }
    if (isPlaying && countdown === null) {
      if (Math.abs(el.currentTime - timelineSec) > 0.35) {
        el.currentTime = timelineSec % (el.duration || TOTAL_DURATION);
      }
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [isPlaying, countdown, selectedTrackId, activeTrack.src]);

  // Trigger choreographed tactile sound effects during playback
  useEffect(() => {
    if (!isPlaying || countdown !== null) return;
    const t = timelineSec;
    if (t < 0.5) {
      lastTriggeredSfxRef.current = {};
    }
    // Transition whoosh at 2.7s
    if (t >= 2.7 && t < 2.9 && !lastTriggeredSfxRef.current.w1) {
      lastTriggeredSfxRef.current.w1 = 1;
      triggerWhoosh();
    }
    // Card tap pop at 6.6s
    if (t >= 6.6 && t < 6.8 && !lastTriggeredSfxRef.current.p1) {
      lastTriggeredSfxRef.current.p1 = 1;
      triggerPop(520);
    }
    // Pencil scribble scratch at 15.28s
    if (t >= 15.28 && t < 15.42 && !lastTriggeredSfxRef.current.scratch) {
      lastTriggeredSfxRef.current.scratch = 1;
      triggerPencilScratch();
    }
    // Foodies sparkle pop at 15.75s
    if (t >= 15.75 && t < 15.90 && !lastTriggeredSfxRef.current.fp) {
      lastTriggeredSfxRef.current.fp = 1;
      triggerPop(840);
    }
    // Detail button tap pop at 17.15s
    if (t >= 17.15 && t < 17.30 && !lastTriggeredSfxRef.current.p2) {
      lastTriggeredSfxRef.current.p2 = 1;
      triggerPop(680);
    }
    // Close ✕ button tap pop at 21.3s
    if (t >= 21.30 && t < 21.45 && !lastTriggeredSfxRef.current.pClose) {
      lastTriggeredSfxRef.current.pClose = 1;
      triggerPop(560);
    }
    // Weekly drop capsule tap pop at 21.65s
    if (t >= 21.65 && t < 21.80 && !lastTriggeredSfxRef.current.pDrop) {
      lastTriggeredSfxRef.current.pDrop = 1;
      triggerPop(720);
    }
    // Outro transition whoosh at 24.0s
    if (t >= 24.0 && t < 24.2 && !lastTriggeredSfxRef.current.w2) {
      lastTriggeredSfxRef.current.w2 = 1;
      triggerWhoosh();
    }
  }, [timelineSec, isPlaying, countdown]);

  // Jump to specific scene time via URL parameter ?t= (e.g. ?t=24.5) for instant inspection
  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      const t = p.get("t");
      if (t !== null && !isNaN(parseFloat(t))) {
        setTimelineSec(parseFloat(t));
        setIsPlaying(false);
      }
    }
  }, []);

  const lastTickRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const stageContainerRef = useRef<HTMLDivElement | null>(null);
  const cropLoopRef = useRef<number | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const pinMarkersRef = useRef<Record<string, HTMLElement>>({});
  const popupAnchorRef = useRef<HTMLDivElement | null>(null);

  // Merge real store dishes (if any have valid http/local images) with our curated Oslo set
  // keeping our 3 hero storyboard dishes first so the cursor choreography hits exact targets.
  const feedDishes = useMemo<AdDishItem[]>(() => {
    if (!storePosts || storePosts.length === 0) return CURATED_AD_DISHES;
    const extra: AdDishItem[] = storePosts
      .filter(
        (p) =>
          p.image_url &&
          !CURATED_AD_DISHES.some((c) =>
            p.dish_name.toLowerCase().includes(c.dishName.toLowerCase().slice(0, 8))
          )
      )
      .slice(0, 2)
      .map((p) => ({
        id: p.id,
        spotId: p.spot_id,
        dishName: p.dish_name,
        spotName: p.spot_name,
        neighborhood: p.spot_neighborhood || "Oslo",
        address: p.spot_address || "Oslo, Norway",
        walkTime: "5 min",
        priceNok: p.price_nok || 135,
        rating: p.rating ? p.rating.toFixed(1) : "4.8",
        verdict:
          p.review_text && !/^Signature /i.test(p.review_text)
            ? p.review_text
            : `Crisp texture, bold seasoning, and standout flavour at ${p.spot_name}.`,
        imageUrl: p.image_url,
        category: p.category || "street_food",
        likes: Math.max(18, p.likes_count || 24),
        lngLat: p.spot_coords || [10.7522, 59.9148],
      }));
    return [...CURATED_AD_DISHES, ...extra];
  }, [storePosts]);

  // Fit stage cleanly to viewport
  useEffect(() => {
    const updateScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const padH = isRecordMode ? 16 : 96;
      const padW = isRecordMode ? 16 : 36;
      const targetW = aspectMode === "9:16" ? 1080 : 1920;
      const targetH = aspectMode === "9:16" ? 1920 : 1080;
      const scaleW = (vw - padW) / targetW;
      const scaleH = (vh - padH) / targetH;
      setStageScale(clamp(Math.min(scaleW, scaleH), 0.22, 1.15));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [aspectMode, isRecordMode]);

  // Initialize the SINGLE continuous full-stage MapLibre GL instance
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE_URL,
      center: [10.7525, 59.9172],
      zoom: 13.8,
      pitch: 0,
      bearing: 0,
      interactive: false,
      attributionControl: false,
    });

    mapRef.current = map;

    // Mount all Oslo food pins + YOU bust + Smakr Pick on the continuous map
    OSLO_RADAR_PINS.forEach((pin) => {
      const el = createRadarPinElement(pin);
      pinMarkersRef.current[pin.id] = el;
      new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat(pin.lngLat)
        .addTo(map);
    });

    const youEl = createYouBustMarkerElement();
    new maplibregl.Marker({ element: youEl, anchor: "bottom" })
      .setLngLat([10.7492, 59.9136])
      .addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      pinMarkersRef.current = {};
    };
  }, []);

  // Resize MapLibre when aspect ratio flips
  useEffect(() => {
    const t = setTimeout(() => {
      mapRef.current?.resize();
    }, 50);
    return () => clearTimeout(t);
  }, [aspectMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
        if (cropLoopRef.current) {
          cancelAnimationFrame(cropLoopRef.current);
          cropLoopRef.current = null;
        }
        setIsDownloading(false);
        setIsRecordMode(false);
        setCountdown(null);
      } else if (e.key.toLowerCase() === "h" && !e.metaKey && !e.ctrlKey) {
        if (!isRecordMode) startRecordCountdown();
        else setIsRecordMode(false);
      } else if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key.toLowerCase() === "r" && !e.metaKey && !e.ctrlKey) {
        setTimelineSec(0);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isRecordMode, isDownloading]);

  const startRecordCountdown = () => {
    setIsRecordMode(true);
    setIsPlaying(false);
    setTimelineSec(0);
    setCountdown(3);
  };

  /**
   * Direct Video Export / Download:
   * Uses browser native tab capture + real-time element cropping to record ONLY
   * the ad stage canvas (strictly 1080x1920 in 9:16 or 1920x1080 in 16:9, zero black bars).
   * Automatically packages and downloads smakr-oslo-ad-reel.mp4 when the 23-second loop completes!
   */
  const handleDownloadVideo = async () => {
    if (isDownloading) return;
    try {
      if (typeof window === "undefined" || !navigator.mediaDevices?.getDisplayMedia) {
        alert("Direct video recording is supported in modern desktop browsers (Chrome, Edge, Firefox).");
        return;
      }

      // Prompt tab share stream - preferCurrentTab hints the browser to pick the current tab
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stream: MediaStream = await (navigator.mediaDevices.getDisplayMedia as any)({
        video: {
          displaySurface: "browser",
          frameRate: 60,
        },
        audio: false,
        preferCurrentTab: true,
        selfBrowserSurface: "include",
      });

      mediaStreamRef.current = stream;
      recordedChunksRef.current = [];

      // Prioritize MP4 (H.264/AVC) so the export saves directly to iPhone Camera Roll & Instagram without conversion
      const candidateTypes = [
        "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
        "video/mp4;codecs=avc1,aac",
        "video/mp4",
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
      ];
      let mimeType = "video/webm";
      if (typeof MediaRecorder !== "undefined") {
        const supported = candidateTypes.find((t) => MediaRecorder.isTypeSupported(t));
        if (supported) mimeType = supported;
      }

      // 1. Enter recording mode and freeze on 0.0s so stage is completely clean, controls are hidden, and scale maximizes
      setIsDownloading(true);
      setIsRecordMode(true);
      setTimelineSec(0);
      setSpeed(1);
      setIsPlaying(false);

      // 2. Allow React state updates, toolbar unmount, stage re-centering, and MapLibre canvas resize to fully settle
      await new Promise((resolve) => setTimeout(resolve, 600));
      mapRef.current?.resize();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      // 3. Create offscreen video element to decode tab frames
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      // 4. Attempt native CropTarget (Chrome 104+) on the fully settled stage container
      let hasNativeCrop = false;
      const stageEl = stageContainerRef.current;
      const [videoTrack] = stream.getVideoTracks();
      if (
        typeof window !== "undefined" &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        "CropTarget" in window &&
        stageEl &&
        videoTrack &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof (videoTrack as any).cropTo === "function"
      ) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cropTarget = await (window as any).CropTarget.fromElement(stageEl);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (videoTrack as any).cropTo(cropTarget);
          hasNativeCrop = true;
        } catch (e) {
          console.warn("Native CropTarget cropTo failed, using canvas element crop fallback:", e);
        }
      }

      // Allow GPU compositor frames to switch from full-tab buffer to cropped element buffer
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 5. Dedicated offscreen master canvas strictly sized to 1080x1920 (or 1920x1080)
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = stageW;
      exportCanvas.height = stageH;
      const ctx = exportCanvas.getContext("2d", { alpha: false });
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
      }

      let isCroppingActive = true;
      const renderCropFrame = () => {
        if (!isCroppingActive) return;
        if (ctx && video.readyState >= 2) {
          const videoRatio = video.videoWidth / Math.max(1, video.videoHeight);
          const targetRatio = stageW / stageH;
          // Guard: Only use native direct draw if the stream video is demonstrably cropped to the stage aspect ratio.
          // In 9:16 vertical mode (targetRatio ~0.5625), if videoRatio is > 0.95 (landscape/square), the stream is still delivering full tab frames!
          const isStreamCropped =
            hasNativeCrop &&
            (aspectMode === "16:9"
              ? Math.abs(videoRatio - targetRatio) < 0.2
              : videoRatio < 0.95);

          if (isStreamCropped) {
            // Video stream is already cropped to stage element by GPU compositor
            ctx.drawImage(video, 0, 0, stageW, stageH);
          } else if (stageContainerRef.current) {
            // Precise fallback: extract exact bounding box of stage element from full tab viewport
            const rect = stageContainerRef.current.getBoundingClientRect();
            const scaleX = video.videoWidth / window.innerWidth;
            const scaleY = video.videoHeight / window.innerHeight;
            const sx = Math.max(0, rect.left * scaleX);
            const sy = Math.max(0, rect.top * scaleY);
            const sw = Math.min(video.videoWidth - sx, rect.width * scaleX);
            const sh = Math.min(video.videoHeight - sy, rect.height * scaleY);
            if (sw > 10 && sh > 10) {
              ctx.drawImage(video, sx, sy, sw, sh, 0, 0, stageW, stageH);
            }
          }
        }
        cropLoopRef.current = requestAnimationFrame(renderCropFrame);
      };

      // Start the cropping loop and let 2 frames paint to guarantee clean master canvas before recording starts
      cropLoopRef.current = requestAnimationFrame(renderCropFrame);
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Capture 60fps stream from the clean, 1080x1920 cropped master canvas
      const croppedStream = exportCanvas.captureStream(60);

      // Mix audio tracks into the recorded stream if soundtrack or SFX are active
      let recordStream = croppedStream;
      if (audioDestRef.current && (selectedTrackId !== "none" || enableSfx)) {
        const audioTracks = audioDestRef.current.stream.getAudioTracks();
        if (audioTracks.length > 0) {
          recordStream = new MediaStream([
            ...croppedStream.getVideoTracks(),
            ...audioTracks,
          ]);
        }
      }

      const recorder = new MediaRecorder(recordStream, {
        mimeType,
        videoBitsPerSecond: 12000000,
        ...(recordStream.getAudioTracks().length > 0 ? { audioBitsPerSecond: 192000 } : {}),
      });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        isCroppingActive = false;
        if (cropLoopRef.current) {
          cancelAnimationFrame(cropLoopRef.current);
          cropLoopRef.current = null;
        }
        video.pause();
        video.srcObject = null;
        video.remove();
        exportCanvas.remove();

        const chunks = recordedChunksRef.current;
        if (chunks.length > 0) {
          const blob = new Blob(chunks, { type: mimeType });
          const ext = mimeType.includes("mp4") ? "mp4" : "webm";
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `smakr-oslo-ad-reel-${aspectMode === "9:16" ? "vertical-9-16" : "horizontal-16-9"}.${ext}`;
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, 2000);
        }

        if (audioElRef.current) {
          audioElRef.current.pause();
        }
        stream.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        mediaRecorderRef.current = null;
        setIsDownloading(false);
        setIsRecordMode(false);
      };

      stream.getVideoTracks()[0].onended = () => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      };

      // Start recording the clean, steady 1080x1920 master canvas
      recorder.start(250);

      // 6. Hold for 1.0 second of clean pre-roll buffer at t = 0.0s
      // Gives the user headroom to trim the very beginning in Instagram Reel / camera roll without losing content
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Guard if recording was aborted during pre-roll
      if (recorder.state !== "recording") return;

      // 7. Start audio and choreography animation together in 100% lockstep sync
      initAudioContext();
      if (audioElRef.current && selectedTrackId !== "none" && activeTrack.src) {
        audioElRef.current.currentTime = 0;
        audioElRef.current.play().catch(() => {});
      }
      setIsPlaying(true);
    } catch (err) {
      console.warn("Video capture cancelled or failed:", err);
      if (cropLoopRef.current) {
        cancelAnimationFrame(cropLoopRef.current);
        cropLoopRef.current = null;
      }
      setIsDownloading(false);
      setIsRecordMode(false);
    }
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const id = setTimeout(() => setCountdown(countdown - 1), 850);
      return () => clearTimeout(id);
    }
    const id = setTimeout(() => {
      setCountdown(null);
      setTimelineSec(0);
      setIsPlaying(true);
    }, 450);
    return () => clearTimeout(id);
  }, [countdown]);

  // Live browser tab title feedback while recording (keeps video canvas 100% clean)
  useEffect(() => {
    if (isDownloading) {
      if (timelineSec === 0 && !isPlaying) {
        document.title = `🔴 [Pre-roll Hold] Starting in 1s · Smakr Video`;
      } else {
        document.title = `🔴 Recording ${timelineSec.toFixed(1)}s / ${TOTAL_DURATION}s · Smakr Video`;
      }
    } else {
      document.title = "Smakr Oslo · Live Ad Reel";
    }
  }, [isDownloading, timelineSec, isPlaying]);

  // Master 60fps requestAnimationFrame timeline loop (0.0s -> 23.0s)
  useEffect(() => {
    if (!isPlaying || countdown !== null) {
      lastTickRef.current = null;
      return;
    }
    let rafId = 0;
    const step = (now: number) => {
      if (lastTickRef.current !== null) {
        const dt = ((now - lastTickRef.current) / 1000) * speed;
        setTimelineSec((prev) => {
          const next = prev + dt;
          if (isDownloading && next >= TOTAL_DURATION) {
            setIsPlaying(false);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
              mediaRecorderRef.current.stop();
            }
            return TOTAL_DURATION;
          }
          return next >= TOTAL_DURATION ? next % TOTAL_DURATION : next;
        });
      }
      lastTickRef.current = now;
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, speed, countdown, isDownloading]);

  const activeScene = useMemo(() => {
    return (
      SCENES.find((s) => timelineSec >= s.start && timelineSec < s.end) ??
      SCENES[0]
    );
  }, [timelineSec]);

  // Stage + phone geometry (stage logical px). Single source of truth for the
  // bezel, the veil cutout, the camera padding and the popup projection.
  const stageW = aspectMode === "9:16" ? 1080 : 1920;
  const stageH = aspectMode === "9:16" ? 1920 : 1080;
  const phoneScale = aspectMode === "9:16" ? 1.48 : 1.04;
  const scaledScreenW = Math.round(PHONE_LOGICAL_W * phoneScale);
  const scaledScreenH = Math.round(PHONE_LOGICAL_H * phoneScale);
  const bezelThickness = aspectMode === "9:16" ? 14 : 11;
  const outerPhoneW = scaledScreenW + bezelThickness * 2;
  const outerPhoneH = scaledScreenH + bezelThickness * 2;
  const phoneRight = aspectMode === "9:16" ? 18 : 96;
  const phoneTop = aspectMode === "9:16" ? 220 : Math.round((stageH - outerPhoneH) / 2);
  const phoneLeft = stageW - phoneRight - outerPhoneW;
  const screenLeft = phoneLeft + bezelThickness;
  const screenTop = phoneTop + bezelThickness;
  const screenRadius = aspectMode === "9:16" ? 54 : 46;

  // ============================================================================
  // CHOREOGRAPHY ENGINE: 3-Act Narrative (Hook -> Live Demo -> Centered Closer)
  // Act 1 (0.0s - 3.5s): Center Mascot Hook ("Hungry in Oslo?")
  // Act 2 (3.5s - 22.5s): Phone Presentation & Walkthrough (100% original speed)
  // Act 3 (22.5s - 27.0s): Centered Mascot Closer, Beta CTA & Catchphrase
  // ============================================================================
  const anim = useMemo(() => {
    const t = timelineSec;

    // Stage horizontal coordinates
    const mascotColWidth = aspectMode === "9:16" ? 390 : 620;
    const mascotCenterX = Math.round((stageW - mascotColWidth) / 2);
    const mascotLeftX = aspectMode === "9:16" ? 18 : 76;

    // Synchronized transition timing for 100% smooth, non-jittery movement
    const ACT1_TRANS_START = 2.7;
    const ACT1_TRANS_DUR = 0.8;
    const ACT3_TRANS_START = 24.0;
    const ACT3_TRANS_DUR = 1.4;

    // 1. Mascot Horizontal Sliding Position (Pure continuous function)
    let mascotX = mascotCenterX;
    if (t < ACT1_TRANS_START) {
      mascotX = mascotCenterX;
    } else if (t < ACT1_TRANS_START + ACT1_TRANS_DUR) {
      const p = easeAppleSmooth((t - ACT1_TRANS_START) / ACT1_TRANS_DUR);
      mascotX = lerp(mascotCenterX, mascotLeftX, p);
    } else if (t < ACT3_TRANS_START) {
      mascotX = mascotLeftX;
    } else if (t < ACT3_TRANS_START + ACT3_TRANS_DUR) {
      const p = easeInOutQuint((t - ACT3_TRANS_START) / ACT3_TRANS_DUR);
      mascotX = lerp(mascotLeftX, mascotCenterX, p);
    } else {
      mascotX = mascotCenterX;
    }

    // 1b. Mascot Scale Animation (Synchronized with position and phone!)
    const bigMascotScale = aspectMode === "9:16" ? 1.25 : 1.15;
    const smallMascotScale = aspectMode === "9:16" ? 0.94 : 0.90;
    let mascotScale = bigMascotScale;
    if (t < ACT1_TRANS_START) {
      mascotScale = bigMascotScale;
    } else if (t < ACT1_TRANS_START + ACT1_TRANS_DUR) {
      const p = easeAppleSmooth((t - ACT1_TRANS_START) / ACT1_TRANS_DUR);
      mascotScale = lerp(bigMascotScale, smallMascotScale, p);
    } else if (t < ACT3_TRANS_START) {
      mascotScale = smallMascotScale;
    } else if (t < ACT3_TRANS_START + ACT3_TRANS_DUR) {
      const p = easeInOutQuint((t - ACT3_TRANS_START) / ACT3_TRANS_DUR);
      mascotScale = lerp(smallMascotScale, bigMascotScale, p);
    } else {
      mascotScale = bigMascotScale;
    }

    // 2. Phone Horizontal Slide-in & Slide-out (Synchronized with mascot!)
    let phoneXOffset = 750;
    let phoneOpacity = 0;
    if (t < ACT1_TRANS_START) {
      phoneXOffset = 750;
      phoneOpacity = 0;
    } else if (t < ACT1_TRANS_START + ACT1_TRANS_DUR) {
      const p = easeAppleSmooth((t - ACT1_TRANS_START) / ACT1_TRANS_DUR);
      phoneXOffset = lerp(750, 0, p);
      phoneOpacity = p;
    } else if (t < ACT3_TRANS_START) {
      phoneXOffset = 0;
      phoneOpacity = 1;
    } else if (t < ACT3_TRANS_START + ACT3_TRANS_DUR) {
      const p = easeInOutQuint((t - ACT3_TRANS_START) / ACT3_TRANS_DUR);
      phoneXOffset = lerp(0, 850, p);
      phoneOpacity = 1 - easeOutCubic(clamp((t - (ACT3_TRANS_START + 0.35)) / (ACT3_TRANS_DUR - 0.35), 0, 1));
    } else {
      phoneXOffset = 850;
      phoneOpacity = 0;
    }

    // 3. Beta CTA Bubble (strictly in Act 3 closer, hidden in rest of video!)
    let betaBubbleOpacity = 0;
    let betaBubbleY = 28;
    let showBetaCtaHighlight = false;
    if (t >= 24.6) {
      const p = easeAppleSmooth(clamp((t - 24.6) / 0.85, 0, 1));
      betaBubbleOpacity = p;
      betaBubbleY = lerp(28, 0, p);
      showBetaCtaHighlight = t >= 25.5 && t < 30.8;
    }

    // 4. Catchphrase Continuous Physical Handwriting & Single-Strike Scribble Choreography:
    // Starts halfway through the video (t = 13.0s).
    // - "for the big backs" is physically written in a steady, unbroken stroke flow with NO pauses (13.0s - 15.0s).
    // - NO pencil appears during the writing of words!
    // - The pencil appears ONLY to scribble over "big backs" ONCE (15.20s - 15.70s) with inverted +42° angle.
    // - "✦ foodies" correction & curved arrow appear cleanly without pencil.
    let writeProgress = 0;
    let scribbleProgress = 0;
    let foodieBrushProgress = 0;
    let arrowProgress = 0;
    let pencilX = 255;
    let pencilY = 75;
    let pencilAngle = 42; // Inverted right-handed tilt (+42deg, eraser top-right)
    let pencilOpacity = 0;
    let catchphraseOpacity = 0;
    let catchphraseScale = 1;

    if (t >= 13.0) {
      catchphraseOpacity = 1;

      // 1. Continuous physical handwriting of "for the big backs" (13.0s - 15.0s) - NO pauses!
      writeProgress = clamp((t - 13.0) / 2.0, 0, 1);

      // 2. Pencil strikes through "big backs" ONCE (15.20s - 15.70s)
      if (t >= 15.20 && t < 15.70) {
        if (t < 15.28) {
          // Pencil drops into position on "big backs" from top-right
          const pIn = clamp((t - 15.20) / 0.08, 0, 1);
          pencilX = lerp(280, 255, pIn);
          pencilY = lerp(50, 75, pIn);
          pencilAngle = 42;
          pencilOpacity = pIn;
        } else if (t < 15.58) {
          // Single confident stroke from left to right crossing out "big backs" ONCE
          const p = easeInOutCubic(clamp((t - 15.28) / 0.30, 0, 1));
          scribbleProgress = p;
          pencilX = lerp(255, 528, p);
          pencilY = lerp(75, 73, p) + Math.sin(p * Math.PI) * 2;
          pencilAngle = 42 + Math.sin(p * 8) * 3;
          pencilOpacity = 1;
        } else {
          // Pencil lifts off and swoops away to the top-right
          scribbleProgress = 1;
          const pOut = clamp((t - 15.58) / 0.12, 0, 1);
          pencilX = 528 + pOut * 35;
          pencilY = 73 - pOut * 40;
          pencilAngle = 42 + pOut * 10;
          pencilOpacity = 1 - pOut;
        }
      } else if (t >= 15.70) {
        scribbleProgress = 1;
        pencilOpacity = 0;
      }

      // 3. "✦ foodies" written above (15.75s - 16.45s) - NO pencil
      if (t >= 15.75) {
        foodieBrushProgress = clamp((t - 15.75) / 0.70, 0, 1);
      }

      // 4. Curved arrow pointing down from foodies to scribble (16.45s - 16.85s) - NO pencil
      if (t >= 16.45) {
        arrowProgress = clamp((t - 16.45) / 0.40, 0, 1);
      }
    }

    if (t >= 24.6) {
      const p = easeAppleSmooth(clamp((t - 24.6) / 0.9, 0, 1));
      catchphraseScale = lerp(1, 1.06, p);
    }

    // 5. Top Brand Header: slides down from top in Act 3 outro with animated underline
    let headerScale = 1;
    let headerY = 0;
    let brandUnderlineProgress = 0;
    if (t >= 24.0) {
      const p = easeAppleSmooth(clamp((t - 24.0) / 1.1, 0, 1));
      headerScale = lerp(1, 1.10, p);
      headerY = lerp(0, aspectMode === "9:16" ? 64 : 36, p);
    }
    if (t >= 24.8) {
      brandUnderlineProgress = easeOutQuint(clamp((t - 24.8) / 0.95, 0, 1));
    }

    // 6. Presentation State Variables (Act 1: idle, Act 2: exact sequence, Act 3: closing ease)
    const PEEK = 600;
    let sheetY = PEEK;
    let feedScrollY = 0;
    let menuScrollY = 0;
    let isMatchaCardTapped = false;
    let focusY = 300;
    let camLng = 10.7535;
    let camLat = 59.9178;
    let camZoom = 13.75;
    let camPitch = 0;
    let camBearing = 0;
    let showOchayaHighlighted = false;
    let showVenuePopupCard = false;
    let isDetailsButtonPressed = false;
    let showRestaurantDetailSheet = false;
    let showWeeklyDropExpanded = false;
    let cursorX = 50;
    let cursorY = 78;
    let isPressed = false;
    let showRipple = false;

    if (t < 3.5) {
      // Act 1: The Hook (gentle background map drift across central Oslo)
      const p = t / 3.5;
      camLng = lerp(10.7535, 10.7550, p);
      camLat = lerp(59.9178, 59.9190, p);
      camZoom = lerp(13.75, 13.90, p);
    } else if (t < ACT3_TRANS_START) {
      // Act 2: Presentation sequence shifted cleanly by +3.5s
      const origT = t - 3.5;

      // Bottom Sheet translateY
      if (origT < 1.1) {
        sheetY = PEEK;
      } else if (origT < 2.5) {
        sheetY = lerp(PEEK, 96, easeAppleSmooth((origT - 1.1) / 1.4));
      } else if (origT < 7.25) {
        sheetY = 96;
      } else if (origT < 7.85) {
        sheetY = lerp(96, PEEK, easeAppleSmooth((origT - 7.25) / 0.6));
      } else if (origT < 17.5) {
        sheetY = PEEK;
      } else if (origT < 18.2) {
        sheetY = lerp(PEEK, 170, easeAppleSmooth((origT - 17.5) / 0.7));
      } else {
        sheetY = 170;
      }

      // Feed scroll offset
      if (origT >= 3.5 && origT < 5.0) {
        feedScrollY = lerp(0, 265, easeInOutQuint((origT - 3.5) / 1.5));
      } else if (origT >= 5.0 && origT < 6.4) {
        feedScrollY = lerp(265, 535, easeInOutQuint((origT - 5.0) / 1.4));
      } else if (origT >= 6.4) {
        feedScrollY = 535;
      }

      isMatchaCardTapped = origT >= 6.6 && origT < 7.4;

      // Camera focus point in phone
      if (origT >= 17.0 && origT < 18.4) focusY = lerp(300, 140, easeAppleSmooth((origT - 17.0) / 1.4));
      else if (origT >= 18.4) focusY = 140;

      // Map camera trajectory
      if (origT < 3.5) {
        const p = origT / 3.5;
        camLng = lerp(10.7550, 10.7555, p);
        camLat = lerp(59.9190, 59.9192, p);
        camZoom = lerp(13.90, 13.95, p);
      } else if (origT < 7.5) {
        const p = easeAppleSmooth((origT - 3.5) / 4.0);
        camLng = lerp(10.7555, 10.7528, p);
        camLat = lerp(59.9192, 59.9165, p);
        camZoom = lerp(13.95, 14.25, p);
      } else if (origT < 10.2) {
        const p = easeAppleSmooth((origT - 7.5) / 2.7);
        camLng = lerp(10.7528, 10.7525, p);
        camLat = lerp(59.9165, 59.9159, p);
        camZoom = lerp(14.25, 15.6, p);
      } else if (origT < 17.2) {
        camLng = 10.7525;
        camLat = 59.9159;
        camZoom = 15.6;
      } else if (origT < 18.8) {
        const p = easeAppleSmooth((origT - 17.2) / 1.6);
        camLng = lerp(10.7525, 10.7572, p);
        camLat = lerp(59.9159, 59.9138, p);
        camZoom = lerp(15.6, 15.3, p);
      } else {
        camLng = 10.7572;
        camLat = 59.9138;
        camZoom = 15.3;
      }

      showOchayaHighlighted = origT >= 8.6 && origT < 17.5;
      showVenuePopupCard = origT >= 10.4 && origT < 17.5;
      isDetailsButtonPressed = origT >= 13.6 && origT < 14.25;
      showRestaurantDetailSheet = origT >= 14.35 && origT < 17.5;
      showWeeklyDropExpanded = origT >= 18.2;

      // Simulated touch cursor & menu scrolling
      if (origT < 1.0) {
        cursorX = 50;
        cursorY = 78;
      } else if (origT < 2.4) {
        cursorX = 50;
        cursorY = lerp(78, 19, easeAppleSmooth((origT - 1.0) / 1.4));
        isPressed = true;
      } else if (origT < 3.5) {
        cursorX = 54;
        cursorY = 64;
      } else if (origT < 6.3) {
        const cycle = (origT - 3.5) % 1.4;
        cursorX = 54;
        cursorY = lerp(72, 40, easeAppleSmooth(clamp(cycle / 1.0, 0, 1)));
        isPressed = cycle < 0.95;
      } else if (origT < 7.5) {
        cursorX = 52;
        cursorY = 56;
        isPressed = origT >= 6.6 && origT < 7.25;
        showRipple = origT >= 6.65 && origT < 7.45;
      } else if (origT < 11.2) {
        cursorX = lerp(52, 50, easeAppleSmooth((origT - 7.5) / 3.7));
        cursorY = lerp(56, 44, easeAppleSmooth((origT - 7.5) / 3.7));
      } else if (origT < 13.4) {
        const p = easeAppleSmooth(clamp((origT - 11.2) / 1.4, 0, 1));
        cursorX = lerp(50, 68, p);
        cursorY = lerp(44, 49, p);
      } else if (origT < 14.5) {
        cursorX = 68;
        cursorY = 49;
        isPressed = origT >= 13.6 && origT < 14.25;
        showRipple = origT >= 13.65 && origT < 14.4;
      } else if (origT < 15.6) {
        // Move into venue detail sheet dishes
        const p = easeAppleSmooth((origT - 14.5) / 1.1);
        cursorX = lerp(68, 50, p);
        cursorY = lerp(49, 54, p);
      } else if (origT < 17.0) {
        // Smoothly scroll down the menu dishes
        const p = easeInOutQuint((origT - 15.6) / 1.4);
        menuScrollY = lerp(0, 115, p);
        cursorX = lerp(50, 52, p);
        cursorY = lerp(54, 68, p);
        isPressed = false;
      } else if (origT < 17.5) {
        // Glides up to close ✕ button
        menuScrollY = 115;
        const p = easeAppleSmooth((origT - 17.0) / 0.5);
        cursorX = lerp(52, 92, p);
        cursorY = lerp(68, 15.5, p);
        isPressed = origT >= 17.3 && origT < 17.5;
        showRipple = origT >= 17.32 && origT < 17.52;
      } else if (origT < 18.2) {
        // Glides down to weekly drop capsule in feed sheet
        const p = easeAppleSmooth((origT - 17.5) / 0.7);
        cursorX = lerp(92, 75, p);
        cursorY = lerp(15.5, 79, p);
        isPressed = origT >= 18.0 && origT < 18.2;
        showRipple = origT >= 18.02 && origT < 18.24;
      } else {
        // Rests peacefully while weekly spotlight dish is proudly displayed
        const p = easeAppleSmooth(clamp((origT - 18.2) / 1.0, 0, 1));
        cursorX = lerp(75, 55, p);
        cursorY = lerp(79, 46, p);
      }
    } else {
      // Act 3: The Closer (reset feed and return camera smoothly to start for 0-seam loop)
      sheetY = PEEK;
      feedScrollY = lerp(535, 0, easeInOutQuint(clamp((t - ACT3_TRANS_START) / 2.5, 0, 1)));
      const p = easeInOutQuint(clamp((t - ACT3_TRANS_START) / 6.0, 0, 1));
      camLng = lerp(10.7572, 10.7535, p);
      camLat = lerp(59.9138, 59.9178, p);
      camZoom = lerp(15.3, 13.75, p);
    }

    return {
      sheetY,
      feedScrollY,
      menuScrollY,
      isMatchaCardTapped,
      camLng,
      camLat,
      camZoom,
      camPitch,
      camBearing,
      showOchayaHighlighted,
      showVenuePopupCard,
      isDetailsButtonPressed,
      showRestaurantDetailSheet,
      showWeeklyDropExpanded,
      showBetaCtaHighlight,
      cursorX,
      cursorY,
      isPressed,
      showRipple,
      focusY,
      mascotX,
      mascotScale,
      phoneXOffset,
      phoneOpacity,
      betaBubbleOpacity,
      betaBubbleY,
      catchphraseOpacity,
      catchphraseScale,
      writeProgress,
      scribbleProgress,
      arrowProgress,
      foodieBrushProgress,
      pencilX,
      pencilY,
      pencilAngle,
      pencilOpacity,
      headerScale,
      headerY,
      brandUnderlineProgress,
    };
  }, [timelineSec, aspectMode, stageW]);

  // Sync the continuous full-stage MapLibre camera & pin states every frame
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Land the camera centre on a fixed point INSIDE the phone screen
    // (horizontal middle, anim.focusY down), expressed as asymmetric padding.
    const targetX = screenLeft + (PHONE_LOGICAL_W / 2) * phoneScale;
    const targetY = screenTop + anim.focusY * phoneScale;
    const padding = {
      left: Math.max(0, 2 * targetX - stageW),
      right: Math.max(0, stageW - 2 * targetX),
      top: Math.max(0, 2 * targetY - stageH),
      bottom: Math.max(0, stageH - 2 * targetY),
    };

    map.jumpTo({
      center: [anim.camLng, anim.camLat],
      zoom: anim.camZoom,
      pitch: anim.camPitch,
      bearing: anim.camBearing,
      padding,
    });

    // Anchor the in-phone venue popup: centered horizontally on the phone screen
    // and vertically positioned smoothly right under the pin.
    const anchor = popupAnchorRef.current;
    if (anchor) {
      const p = map.project(OCHAYA_LNGLAT);
      const ly = (p.y - screenTop) / phoneScale;
      const clampedLy = clamp(ly + 16, 200, 420);
      anchor.style.transform = `translate3d(0, ${clampedLy}px, 0)`;
    }

    // Highlight Ochaya pin when active
    const ochayaEl = pinMarkersRef.current["spot-ochaya"];
    if (ochayaEl) {
      const puck = ochayaEl.querySelector<HTMLElement>(".smakr-map-puck");
      const visual = ochayaEl.querySelector<HTMLElement>(".pin-visual");
      if (puck && visual) {
        if (anim.showOchayaHighlighted) {
          visual.style.transform = "scale(1.22)";
          ochayaEl.style.zIndex = "35";
          puck.style.border = "2.5px solid #E84A27";
          puck.style.boxShadow =
            "0 0 0 6px rgba(232,74,39,0.24), 0 8px 20px rgba(232,74,39,0.38)";
        } else {
          visual.style.transform = "scale(1)";
          ochayaEl.style.zIndex = "15";
          puck.style.border = "1.5px solid rgba(255,255,255,0.95)";
          puck.style.boxShadow = "0 4px 12px rgba(24,22,21,0.16)";
        }
      }
    }
  }, [
    anim.camLng,
    anim.camLat,
    anim.camZoom,
    anim.camPitch,
    anim.camBearing,
    anim.focusY,
    anim.showOchayaHighlighted,
    screenLeft,
    screenTop,
    phoneScale,
    stageW,
    stageH,
  ]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#141312] flex flex-col items-center justify-center overflow-hidden select-none">
      {/* ===================================================================== */}
      {/* FLOATING PRODUCTION TOOLBAR (Hidden in Record Mode)                   */}
      {/* ===================================================================== */}
      {!isRecordMode && (
        <header className="w-full max-w-6xl mx-auto px-4 pt-3 pb-2 flex flex-wrap items-center justify-between gap-2 z-50">
          <div className="flex items-center gap-2 bg-[#22201E] border border-white/10 rounded-2xl px-3 py-1.5 shadow-lg">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e84a27] animate-pulse" />
            <span className="font-comico text-xs tracking-wider text-white uppercase">
              SMAKR AD STAGE
            </span>

            <div className="h-4 w-px bg-white/10 mx-1" />

            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#e84a27] hover:bg-[#d43d1c] text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Play</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setTimelineSec(0)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-zinc-200 transition-colors cursor-pointer"
              title="Restart Loop (R)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Timeline Scrubber */}
            <div className="flex items-center gap-2 px-2">
              <input
                type="range"
                min={0}
                max={TOTAL_DURATION}
                step={0.05}
                value={timelineSec}
                onChange={(e) => setTimelineSec(parseFloat(e.target.value))}
                className="w-28 sm:w-40 accent-[#e84a27] cursor-pointer"
              />
              <span className="font-mono text-[11px] font-bold text-zinc-300 w-20 text-right">
                {timelineSec.toFixed(1)}s / {Math.round(TOTAL_DURATION)}s
              </span>
            </div>
          </div>

          {/* Scene Jump Pills */}
          <div className="flex items-center gap-1 bg-[#22201E] border border-white/10 rounded-2xl p-1 shadow-lg">
            {SCENES.map((s) => {
              const isCurrent = activeScene.id === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setTimelineSec(s.start + 0.05)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-[#e84a27] text-white shadow-xs"
                      : "text-zinc-400 hover:text-white hover:bg-white/5"
                  }`}
                  title={s.label}
                >
                  {s.code}
                </button>
              );
            })}
          </div>

          {/* Speed, Aspect Ratio, Safe Zone, Download & Record Mode */}
          <div className="flex items-center gap-1.5 bg-[#22201E] border border-white/10 rounded-2xl p-1.5 shadow-lg">
            <div className="flex items-center bg-black/30 rounded-xl p-0.5">
              {([0.5, 0.75, 1, 1.25] as PlaybackSpeed[]).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setSpeed(spd)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                    speed === spd
                      ? "bg-white text-[#181615]"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title={`${spd}x Speed`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <div className="flex items-center bg-black/30 rounded-xl p-0.5">
              <button
                type="button"
                onClick={() => setAspectMode("9:16")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  aspectMode === "9:16"
                    ? "bg-white text-[#181615]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Smartphone className="w-3 h-3" />
                <span>9:16</span>
              </button>
              <button
                type="button"
                onClick={() => setAspectMode("16:9")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                  aspectMode === "16:9"
                    ? "bg-white text-[#181615]"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                <Maximize2 className="w-3 h-3" />
                <span>16:9</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSafeZone((v) => !v)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                showSafeZone
                  ? "bg-red-500/20 border-red-500/50 text-red-300"
                  : "bg-white/5 border-transparent text-zinc-400 hover:text-white"
              }`}
            >
              {showSafeZone ? (
                <Eye className="w-3.5 h-3.5" />
              ) : (
                <EyeOff className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Safe Zone</span>
            </button>

            {/* Audio Soundtrack & SFX Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  initAudioContext();
                  setShowAudioMenu((v) => !v);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                  showAudioMenu
                    ? "bg-[#e84a27] border-[#e84a27] text-white shadow-xs"
                    : selectedTrackId !== "none" && !isAudioMuted
                    ? "bg-white/10 hover:bg-white/15 border-white/15 text-zinc-100"
                    : "bg-white/5 hover:bg-white/10 border-transparent text-zinc-400"
                }`}
                title="Choose ad music and sound effects"
              >
                {isAudioMuted || selectedTrackId === "none" ? (
                  <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
                ) : (
                  <Music className="w-3.5 h-3.5 text-[#e84a27]" />
                )}
                <span className="max-w-[80px] sm:max-w-[120px] truncate">
                  {activeTrack.name}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {/* Audio Popover */}
              <AnimatePresence>
                {showAudioMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-2 right-0 z-[110] w-72 p-3 bg-[#1c1a18] border border-white/15 rounded-2xl shadow-2xl backdrop-blur-xl text-left select-none"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                      <div>
                        <h4 className="font-comico text-sm text-white tracking-wide">
                          AD SOUNDTRACK
                        </h4>
                        <p className="text-[10px] text-zinc-400">
                          Bakes with video into the download
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAudioMenu(false)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Track List */}
                    <div className="space-y-1 mb-2.5 max-h-56 overflow-y-auto no-scrollbar">
                      {allTracks.map((track) => {
                        const isSelected = selectedTrackId === track.id;
                        return (
                          <button
                            key={track.id}
                            type="button"
                            onClick={() => {
                              initAudioContext();
                              setSelectedTrackId(track.id);
                              if (isAudioMuted) setIsAudioMuted(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                              isSelected
                                ? "bg-[#e84a27]/25 border border-[#e84a27]/70 text-white"
                                : "hover:bg-white/5 border border-transparent text-zinc-300"
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold truncate">
                                  {track.name}
                                </span>
                                <span className="px-1.5 py-0.2 rounded-md bg-white/10 text-[9px] font-mono font-medium text-zinc-300 shrink-0">
                                  {track.genre}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                                {track.desc}
                              </p>
                            </div>
                            {isSelected && (
                              <Check className="w-4 h-4 text-[#e84a27] shrink-0" />
                            )}
                          </button>
                        );
                      })}

                      {/* Custom Audio Upload Option */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-dashed border-white/25 hover:border-[#e84a27] hover:bg-[#e84a27]/10 text-[11px] font-bold text-zinc-200 transition-all cursor-pointer mt-1.5"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#e84a27]" />
                        <span>Upload Custom Audio (.mp3, .wav)</span>
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        onChange={handleCustomAudioUpload}
                        className="hidden"
                      />
                    </div>

                    {/* Volume & SFX Controls */}
                    <div className="pt-2 border-t border-white/10 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAudioMuted((m) => !m)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 cursor-pointer"
                          title={isAudioMuted ? "Unmute" : "Mute"}
                        >
                          {isAudioMuted ? (
                            <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 text-[#e84a27]" />
                          )}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={isAudioMuted ? 0 : audioVolume}
                          onChange={(e) => {
                            initAudioContext();
                            setAudioVolume(parseFloat(e.target.value));
                            if (isAudioMuted) setIsAudioMuted(false);
                          }}
                          className="flex-1 accent-[#e84a27] h-1.5 bg-white/10 rounded-lg cursor-pointer"
                        />
                        <span className="font-mono text-[10px] text-zinc-400 w-8 text-right">
                          {isAudioMuted ? "0%" : `${Math.round(audioVolume * 100)}%`}
                        </span>
                      </div>

                      <label className="flex items-center justify-between text-[11px] text-zinc-300 cursor-pointer pt-1">
                        <span>Tactile SFX (Pencil scratch &amp; pops)</span>
                        <input
                          type="checkbox"
                          checked={enableSfx}
                          onChange={(e) => {
                            initAudioContext();
                            setEnableSfx(e.target.checked);
                          }}
                          className="accent-[#e84a27] w-3.5 h-3.5 cursor-pointer rounded"
                        />
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Direct Video Download Button */}
            <button
              type="button"
              onClick={handleDownloadVideo}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#e84a27] hover:bg-[#d43f1f] text-white text-[11px] font-extrabold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              title="Record & download video directly (.webm/.mp4)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? "Recording..." : "Download Video"}</span>
            </button>

            <button
              type="button"
              onClick={startRecordCountdown}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold shadow-sm transition-colors cursor-pointer"
              title="Hide UI & Start 3-2-1 Countdown (H)"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Record (H)</span>
            </button>
          </div>
        </header>
      )}

      {/* Floating Exit Record Mode button for touch devices / quick exit */}
      {isRecordMode && !isDownloading && (
        <button
          type="button"
          onClick={() => setIsRecordMode(false)}
          className="fixed top-4 right-4 z-[120] px-3.5 py-1.5 rounded-full bg-black/75 hover:bg-black/90 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-xl cursor-pointer transition-all"
        >
          ✕ Exit Record Mode
        </button>
      )}

      {/* ===================================================================== */}
      {/* THE STAGE (1080x1920 in 9:16 OR 1920x1080 in 16:9)                    */}
      {/* ===================================================================== */}
      <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
        <div
          style={{
            width: Math.round(stageW * stageScale),
            height: Math.round(stageH * stageScale),
          }}
          className="relative flex items-center justify-center"
        >
          <div
            ref={stageContainerRef}
            id="stage-ad-container"
            style={{
              width: stageW,
              height: stageH,
              transform: `scale(${stageScale})`,
              transformOrigin: "top left",
            }}
            className={`absolute top-0 left-0 overflow-hidden bg-[#F5EFE4] ${
              isDownloading || isRecordMode
                ? "rounded-none shadow-none"
                : "rounded-[24px] shadow-[0_30px_90px_rgba(0,0,0,0.65)]"
            }`}
          >
            {/* =============================================================== */}
            {/* LAYER 0: CONTINUOUS FULL-STAGE LIVE MAPLIBRE GL MAP             */}
            {/* Covers the entire canvas AND shows through the iPhone lens!     */}
            {/* =============================================================== */}
            <div
              ref={mapContainerRef}
              className="absolute inset-0 w-full h-full z-0"
              style={{
                filter: "sepia(0.08) saturate(0.95) brightness(1.02)",
              }}
            />

            {/* SVG Mask definition for phone screen cutout */}
            <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
              <defs>
                <mask id="stage-veil-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={stageW} height={stageH}>
                  <rect x="0" y="0" width={stageW} height={stageH} fill="#FFFFFF" />
                  <rect
                    x={screenLeft + anim.phoneXOffset}
                    y={screenTop}
                    width={scaledScreenW}
                    height={scaledScreenH}
                    rx={screenRadius}
                    ry={screenRadius}
                    fill="#000000"
                  />
                </mask>
              </defs>
            </svg>

            {/* =============================================================== */}
            {/* LAYER 1: STAGE WARM BLURRED LINEN VEIL OUTSIDE PHONE             */}
            {/* Softens the background map with gentle 4px blur outside phone,   */}
            {/* leaving screen viewport 100% crystal-clear down to Layer 0!      */}
            {/* =============================================================== */}
            <div
              style={{
                mask: "url(#stage-veil-mask)",
                WebkitMask: "url(#stage-veil-mask)",
                backdropFilter: "blur(4px)",
                WebkitBackdropFilter: "blur(4px)",
                backgroundColor: "rgba(247, 242, 232, 0.40)",
              }}
              className="absolute inset-0 z-[5] pointer-events-none"
            />

            {/* =============================================================== */}
            {/* LAYER 2: TOP-CENTERED CAMPAIGN BRAND HEADER                     */}
            {/* "Discover through" in pill border; "SMAKR" outside border like logo */}
            {/* =============================================================== */}
            <div
              style={{
                transform: `translate3d(-50%, ${anim.headerY}px, 0) scale(${anim.headerScale})`,
                willChange: "transform",
              }}
              className={`absolute z-30 left-1/2 ${
                aspectMode === "9:16" ? "top-[82px]" : "top-[48px]"
              }`}
            >
              <div
                className={`inline-flex items-center whitespace-nowrap select-none ${
                  aspectMode === "9:16" ? "gap-5" : "gap-3.5"
                }`}
              >
                <div
                  className={`inline-flex items-center rounded-full bg-[#FAF7F2] border border-white/90 shadow-[0_18px_44px_rgba(24,22,21,0.18)] ${
                    aspectMode === "9:16"
                      ? "gap-3.5 px-9 py-4"
                      : "gap-2.5 px-6 py-2.5"
                  }`}
                >
                  <span
                    className={`font-comico text-[#e84a27] ${
                      aspectMode === "9:16" ? "text-[28px]" : "text-base"
                    }`}
                  >
                    ✦
                  </span>
                  <span
                    className={`font-comico tracking-wide text-[#181615] ${
                      aspectMode === "9:16" ? "text-[36px]" : "text-[22px]"
                    }`}
                  >
                    Discover through
                  </span>
                </div>
                <div className="relative inline-flex flex-col items-center">
                  <span
                    className={`font-comico tracking-wide text-[#e84a27] ${
                      aspectMode === "9:16" ? "text-[66px]" : "text-[38px]"
                    }`}
                    style={{
                      filter:
                        aspectMode === "9:16"
                          ? "drop-shadow(4.5px 0 0 #FFFFFF) drop-shadow(-4.5px 0 0 #FFFFFF) drop-shadow(0 4.5px 0 #FFFFFF) drop-shadow(0 -4.5px 0 #FFFFFF) drop-shadow(0 12px 26px rgba(232,74,39,0.38))"
                          : "drop-shadow(2.5px 0 0 #FFFFFF) drop-shadow(-2.5px 0 0 #FFFFFF) drop-shadow(0 2.5px 0 #FFFFFF) drop-shadow(0 -2.5px 0 #FFFFFF) drop-shadow(0 6px 14px rgba(232,74,39,0.30))",
                    }}
                  >
                    SMAKR
                  </span>

                  {/* Animated brand underline that draws under SMAKR in the outro */}
                  <svg
                    viewBox="0 0 220 28"
                    className="absolute -bottom-4 left-1/2 -translate-x-1/2 pointer-events-none overflow-visible"
                    style={{
                      width: aspectMode === "9:16" ? "240px" : "150px",
                      height: aspectMode === "9:16" ? "28px" : "18px",
                      opacity: anim.brandUnderlineProgress > 0.01 ? 1 : 0,
                      transition: "opacity 0.2s ease-out",
                    }}
                  >
                    {/* White die-cut outline behind the animated line */}
                    <path
                      d="M 6 14 C 55 6, 155 20, 212 11"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth={aspectMode === "9:16" ? "9" : "6"}
                      strokeLinecap="round"
                      strokeDasharray={220}
                      strokeDashoffset={220 * (1 - anim.brandUnderlineProgress)}
                    />
                    {/* Vivid Burnt Paprika stroke */}
                    <path
                      d="M 6 14 C 55 6, 155 20, 212 11"
                      fill="none"
                      stroke="#E84A27"
                      strokeWidth={aspectMode === "9:16" ? "5" : "3.5"}
                      strokeLinecap="round"
                      strokeDasharray={220}
                      strokeDashoffset={220 * (1 - anim.brandUnderlineProgress)}
                    />
                    {/* Sparkle star at the finish tip */}
                    {anim.brandUnderlineProgress > 0.85 && (
                      <g
                        transform={`translate(216, 11) scale(${
                          aspectMode === "9:16"
                            ? (anim.brandUnderlineProgress - 0.85) * 6.6
                            : 0.7
                        })`}
                        style={{
                          filter: "drop-shadow(0 2px 6px rgba(232,74,39,0.5))",
                        }}
                      >
                        <path
                          d="M 0 -8 Q 1 -1 8 0 Q 1 1 0 8 Q -1 1 -8 0 Q -1 -1 0 -8 Z"
                          fill="#E84A27"
                          stroke="#FFFFFF"
                          strokeWidth="1.5"
                        />
                      </g>
                    )}
                  </svg>
                </div>
              </div>
            </div>

            {/* =============================================================== */}
            {/* LAYER 3: HOLLOW IPHONE 16 PRO TITANIUM BEZEL + LENS VIEWPORT    */}
            {/* Outer wrapper is bg-transparent so the map shows through!       */}
            {/* =============================================================== */}
            <div
              style={{
                width: outerPhoneW,
                height: outerPhoneH,
                left: phoneLeft + anim.phoneXOffset,
                top: phoneTop,
                opacity: anim.phoneOpacity,
                // Deep directional left-cast shadow matching the user's inspiration mockup
                boxShadow:
                  "-42px 52px 84px rgba(18, 16, 14, 0.42), -16px 22px 38px rgba(18, 16, 14, 0.26), 0 12px 30px rgba(18, 16, 14, 0.16)",
              }}
              className="absolute z-20 rounded-[68px] bg-transparent pointer-events-none ring-2 ring-[#4A4744]/80 transition-opacity duration-300"
            >
              {/* Outer Titanium Bezel Shell (hollow center) */}
              <div
                style={{
                  borderWidth: `${bezelThickness}px`,
                }}
                className="absolute inset-0 rounded-[68px] border-[#161514] pointer-events-none z-30"
              />

              {/* Hardware Titanium Side Buttons */}
              <div className="absolute -left-[5px] top-[180px] w-[4px] h-[44px] rounded-l-md bg-[#3A3835] z-30" />
              <div className="absolute -left-[5px] top-[250px] w-[4px] h-[78px] rounded-l-md bg-[#3A3835] z-30" />
              <div className="absolute -left-[5px] top-[344px] w-[4px] h-[78px] rounded-l-md bg-[#3A3835] z-30" />
              <div className="absolute -right-[5px] top-[270px] w-[4px] h-[108px] rounded-r-md bg-[#3A3835] z-30" />

              {/* The Clear Screen Viewport */}
              <div
                style={{
                  position: "absolute",
                  left: bezelThickness,
                  top: bezelThickness,
                  width: scaledScreenW,
                  height: scaledScreenH,
                  borderRadius: screenRadius,
                }}
                className="overflow-hidden bg-transparent pointer-events-auto"
              >
                {/* =========================================================== */}
                {/* TRUE 393x852 LOGICAL IPHONE VIEWPORT (SCALED CLEANLY)       */}
                {/* =========================================================== */}
                <div
                  style={{
                    width: PHONE_LOGICAL_W,
                    height: PHONE_LOGICAL_H,
                    transform: `scale(${phoneScale})`,
                    transformOrigin: "top left",
                  }}
                  className="relative overflow-hidden font-sans text-[#181615]"
                >
                  {/* 1. Native iOS Status Bar + Dynamic Island (Inspo-matched) */}
                  <div className="absolute top-0 inset-x-0 h-[46px] px-7 flex items-center justify-between z-40 pointer-events-none">
                    <span className="text-[13px] font-extrabold tracking-tight text-[#181615] drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
                      9:50
                    </span>

                    {/* Dynamic Island Pill */}
                    <div className="w-[104px] h-[29px] rounded-full bg-black shadow-md flex items-center justify-end px-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1a1f2e] ring-1 ring-white/10" />
                    </div>

                    {/* Signal / Wi-Fi / Battery */}
                    <div className="flex items-center gap-1.5 text-[#181615]">
                      <div className="flex items-end gap-[1.5px] h-2.5">
                        <span className="w-[2.5px] h-1 bg-[#181615] rounded-xs" />
                        <span className="w-[2.5px] h-1.5 bg-[#181615] rounded-xs" />
                        <span className="w-[2.5px] h-2 bg-[#181615] rounded-xs" />
                        <span className="w-[2.5px] h-2.5 bg-[#181615] rounded-xs" />
                      </div>
                      <span className="text-[10px] font-extrabold">5G</span>
                      <div className="w-5 h-2.5 rounded-[3px] border border-[#181615] p-[1.5px] flex items-center">
                        <div className="w-full h-full bg-[#181615] rounded-[1px]" />
                      </div>
                    </div>
                  </div>

                  {/* 2. Real Website Floating Header (`Header.tsx` exact match) */}
                  <div className="absolute top-[48px] inset-x-3.5 flex items-center justify-between z-30 pointer-events-none">
                    <div className="bg-white/45 backdrop-blur-md shadow-sm border border-white/40 rounded-full px-3.5 py-1.5">
                      <SmakrLogo variant="solid-orange" />
                    </div>

                    <div className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white/45 backdrop-blur-md shadow-sm border border-white/40">
                      <span className="w-7 h-7 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden ring-1 ring-black/5 shrink-0">
                        <OfficialSmakrMascot size={28} />
                      </span>
                      <span className="text-xs font-semibold text-zinc-800">
                        @smak
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                    </div>
                  </div>

                  {/* 3. Real Website Floating Map Controls (`MapControls.tsx` exact match) */}
                  <div className="absolute right-3.5 top-[96px] z-20 flex flex-col items-end gap-2 pointer-events-none">
                    <div className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-xl bg-white/95 text-zinc-700 border border-zinc-200 shadow-md backdrop-blur-md">
                      <Navigation className="w-3.5 h-3.5 text-[#e84a27]" />
                      <span className="text-[11px] font-bold text-zinc-700">Find me</span>
                    </div>
                    <div className="rounded-xl bg-white/95 backdrop-blur-md border border-zinc-200 shadow-md flex flex-col overflow-hidden w-9">
                      <span className="h-8 flex items-center justify-center font-bold text-sm text-zinc-800 border-b border-zinc-200/80">
                        +
                      </span>
                      <span className="h-8 flex items-center justify-center font-bold text-sm text-zinc-800">
                        −
                      </span>
                    </div>
                  </div>

                  {/* 4. Real Frosted Glass Venue Popup Card (`MapRadarView.tsx` Scene 4) */}
                  <div
                    ref={popupAnchorRef}
                    className="absolute inset-x-0 top-0 flex justify-center pointer-events-none z-25"
                    style={{ willChange: "transform" }}
                  >
                    <AnimatePresence>
                      {anim.showVenuePopupCard && (
                        <motion.div
                          initial={{ opacity: 0, y: 12, scale: 0.94 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                          style={{
                            background: "rgba(250, 247, 242, 0.92)",
                            backdropFilter: "blur(20px)",
                            WebkitBackdropFilter: "blur(20px)",
                          }}
                          className="w-[284px] rounded-[18px] border border-white/80 shadow-[0_16px_36px_rgba(24,22,21,0.18)] p-2.5 pointer-events-auto relative"
                        >
                          {/* Top pointer triangle toward pin */}
                          <div
                            className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
                            style={{
                              borderLeft: "8px solid transparent",
                              borderRight: "8px solid transparent",
                              borderBottom: "8px solid rgba(250, 247, 242, 0.92)",
                            }}
                          />

                          {/* Close ✕ button matching MapRadarView */}
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/[0.07] flex items-center justify-center text-stone-600 text-[10px]">
                            ✕
                          </div>

                          <div className="flex items-center gap-2.5">
                            <div className="w-[66px] h-[66px] rounded-[13px] overflow-hidden shrink-0 bg-stone-200 border border-black/10">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={CURATED_AD_DISHES[2].imageUrl}
                                alt="Ochaya"
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="flex-1 min-w-0 pr-4">
                              <p className="font-comico text-[14px] font-bold text-[#181615] truncate">
                                Ochaya - The Matcha
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="bg-[#181615] text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded-[5px] inline-flex items-center gap-0.5">
                                  <span className="text-amber-400">★</span> 4.9
                                </span>
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Open · Closes 20:00
                                </span>
                                <span className="text-[9.5px] font-bold text-emerald-700">
                                  · 350m
                                </span>
                              </div>
                              <p className="text-[10.5px] text-stone-600 mt-1 truncate">
                                📍 Bernt Ankers gate 6a, Sentrum
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-1.5 mt-2 pt-2 border-t border-black/[0.06]">
                            <div className="flex-1 h-[30px] rounded-[8px] bg-white/90 border border-black/10 text-[#181615] text-[10px] font-bold flex items-center justify-center gap-1">
                              <span>Directions</span> ↗
                            </div>
                            <div
                              className={`flex-1 h-[30px] rounded-[8px] bg-[#e84a27] text-white font-comico text-[10px] font-bold flex items-center justify-center gap-1 shadow-xs transition-transform ${
                                anim.isDetailsButtonPressed ? "scale-95" : "scale-100"
                              }`}
                            >
                              <span>Details</span> →
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 5. REAL WEBSITE SLIDE-UP MOBILE FEED SHEET (`HomeView.tsx`) */}
                  <div
                    style={{
                      height: PHONE_LOGICAL_H - 48,
                      transform: `translate3d(0, ${anim.sheetY}px, 0)`,
                    }}
                    className="absolute inset-x-0 top-[48px] z-20 bg-[#FAF7F2] rounded-t-[28px] border-t border-black/[0.08] shadow-[0_-10px_34px_rgba(24,22,21,0.14)] flex flex-col overflow-hidden"
                  >
                    {/* Sticky Sheet Header: Grab Handle + MascotWeeklyDrop + FeedFilterBar */}
                    <div className="bg-[#FAF7F2] border-b border-black/[0.06] pt-2 pb-1.5 px-3.5 shrink-0">
                      <div className="w-10 h-1 rounded-full bg-zinc-300 mx-auto mb-2" />

                      {/* Unified Header Row (`MascotWeeklyDrop.tsx`) */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-comico text-sm tracking-wider text-[#e84a27] uppercase">
                            FEED
                          </span>
                          <span className="text-[10px] font-mono font-bold text-stone-500 bg-stone-200/70 px-2 py-0.5 rounded-full">
                            {feedDishes.length}
                          </span>
                        </div>

                        {/* Frosted White Capsule (`✦ Smakr Pick`) — NO harsh black box! */}
                        <div
                          className={`inline-flex items-center gap-1.5 rounded-full bg-white border shadow-xs pl-1 pr-2.5 py-0.5 transition-all ${
                            anim.showWeeklyDropExpanded
                              ? "border-[#e84a27] ring-2 ring-[#e84a27]/20 scale-[1.03]"
                              : "border-black/10"
                          }`}
                        >
                          <div className="w-6 h-6 rounded-full overflow-hidden bg-stone-100 ring-1 ring-black/10 flex items-center justify-center shrink-0">
                            <OfficialSmakrMascot size={24} />
                          </div>
                          <span className="text-[11px] font-semibold text-zinc-900 truncate">
                            <span className="text-[#e84a27] font-bold">
                              ✦ Smakr Pick
                            </span>
                            <span className="text-zinc-400 mx-1">·</span>
                            <span>{weeklyPick?.dish_name ? `${weeklyPick.dish_name} · Em Oi!` : "Coconut Coffee · Em Oi!"}</span>
                          </span>
                          <ChevronDown
                            className={`w-3 h-3 text-zinc-400 transition-transform ${
                              anim.showWeeklyDropExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </div>
                      </div>

                      {/* Expanded Weekly Drop Card (`MascotWeeklyDrop.tsx` Scene 5B) */}
                      <AnimatePresence>
                        {anim.showWeeklyDropExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.28 }}
                            className="overflow-hidden mt-2"
                          >
                            <div className="rounded-2xl bg-white border border-[#e84a27]/25 p-3 shadow-md">
                              <div className="flex items-center gap-2.5">
                                <div className="w-14 h-16 shrink-0 flex items-end justify-center overflow-visible">
                                  <SmakrMascotRig
                                    frameMode="bust-only"
                                    bodyPose="coffee"
                                    face="eating-happy"
                                    head={OFFICIAL_SMAKR_MASCOT_CONFIG.peepsHead}
                                    accessories="glasses-2"
                                    facialHair="none"
                                    skinColor={OFFICIAL_SMAKR_MASCOT_CONFIG.skinColor}
                                    clothingColor={OFFICIAL_SMAKR_MASCOT_CONFIG.topColor}
                                    innerClothingColor={OFFICIAL_SMAKR_MASCOT_CONFIG.bottomColor}
                                    hatColor={OFFICIAL_SMAKR_MASCOT_CONFIG.hatColor}
                                    headContrastColor={OFFICIAL_SMAKR_MASCOT_CONFIG.hairColor}
                                    size={58}
                                    stickerOutline
                                  />
                                </div>
                                <div className="flex-1 min-w-0 bg-[#FAF7F2] rounded-xl p-2 border border-black/[0.06]">
                                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#e84a27] block">
                                    ✦ THIS WEEK&apos;S DROP · @SMAK
                                  </span>
                                  <p className="text-[11px] font-semibold text-stone-800 leading-snug mt-0.5">
                                    &ldquo;{weeklyPick?.speech_bubble || "Order a warm 🥥 coffee at EM oi"}&rdquo;
                                  </p>
                                </div>
                              </div>

                              {/* Spotlight Dish Row */}
                              <div className="mt-2.5 flex items-center gap-2.5 p-2 rounded-xl bg-[#FAF7F2] border border-black/[0.06]">
                                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-stone-100">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={weeklyPick?.dish_image || "/api/places/photos?ref=places%2FChIJD2_7HwBvQUYRIvCPdJLygVQ%2Fphotos%2FAa-ngMbKjYpRxnpEzTkHgtBXVEdEc2s6mH11KAANDyvwPvkedD5yLTQxpla7lgrqo9RqVQi5A5vCNYgAwpRXxWnP_KaI8nB7wcv9q2HaOdifWSOt4uOwaavzH0AI6nPpWPZVbyLrE49HKmDyEgNZVIC_GOVe0jr7zBiTRVOPTyzqJiIE9WitbzW4pykvtOWbLdpfcyOagcIFEHiuyQ23KQd8TS2AyQOGAQybzsbV3ls2dYuiASEcWJHKtkcxNU5vqqhtzvGRy3W95GqedSCO3YchY6OdmdtqIdvT-E7yUGjZDJ_nOYAzpwSNa6Au3xsVfVSLk86Vxf0gZo-u_hI1UjX_dZHbouoVhwv9iA4mIVDGNoUqTX3LY49OBgIDjaSQX_I6tXGmeuv6fbNUb9qfrPOxHTxBRnRccaGbMjiKzTytYxXn_g&category=ramen&i=0&w=800"}
                                    alt="Weekly Pick"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-comico text-xs font-bold text-[#181615] truncate">
                                    {weeklyPick?.dish_name || "Coconut Coffee"}
                                  </p>
                                  <p className="text-[10px] font-semibold text-stone-500 truncate">
                                    📍 Em Oi! · Grønland · ★ 4.7
                                  </p>
                                </div>
                                <span className="bg-[#e84a27] text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shrink-0">
                                  {weeklyPick?.price_nok || 79} kr
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Clean Light Category Filter Bar (`FeedFilterBar.tsx` match) */}
                      <div className="flex items-center gap-1.5 mt-2 overflow-hidden">
                        <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border bg-white text-zinc-600 border-zinc-200/80">
                          <Bookmark className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                          <span>Saved</span>
                        </span>
                        {[
                          { label: "All", active: true },
                          { label: "🥟 Dumplings", active: false },
                          { label: "🍵 Matcha", active: false },
                          { label: "🥐 Bakeries", active: false },
                          { label: "🍜 Ramen", active: false },
                        ].map((cat) => (
                          <span
                            key={cat.label}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap border shrink-0 ${
                              cat.active
                                ? "bg-[#e84a27] text-white border-[#e84a27] shadow-2xs"
                                : "bg-white text-stone-700 border-zinc-200/80"
                            }`}
                          >
                            {cat.label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Scrollable Feed Stream (Warm Editorial Light Cards — zero black boxes!) */}
                    <div className="flex-1 overflow-hidden px-3.5 pt-3">
                      <div
                        style={{
                          transform: `translate3d(0, -${anim.feedScrollY}px, 0)`,
                        }}
                        className="space-y-3.5 pb-24"
                      >
                        {feedDishes.map((dish) => {
                          const isMatcha = dish.id === "ad-dish-matcha";
                          const isTapped = isMatcha && anim.isMatchaCardTapped;
                          return (
                            <article
                              key={dish.id}
                              className={`group relative w-full rounded-[24px] overflow-hidden border border-black/[0.08] bg-[#181615]/85 backdrop-blur-md shadow-md transition-all duration-200 ${
                                isTapped
                                  ? "scale-[0.97] ring-3 ring-[#e84a27] border-[#e84a27]"
                                  : "border-black/[0.08]"
                              }`}
                            >
                              {/* Full-Bleed 4:3 Dish Photo with Bottom Dark Vignette Gradient */}
                              <div className="relative w-full aspect-[4/3] min-h-[220px] overflow-hidden bg-zinc-900">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={dish.imageUrl}
                                  alt={dish.dishName}
                                  className="w-full h-full object-cover opacity-90 transition-transform duration-500"
                                />

                                {/* Seamless Dark Gradient Overlay covering the lower portion */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-transparent pointer-events-none" />

                                {/* Floating Top Badges */}
                                <div className="absolute top-2.5 inset-x-2.5 flex items-start justify-between gap-1.5 z-10">
                                  {/* Top-Left Price Sticker */}
                                  <span className="font-sans font-bold tracking-tight bg-[#e84a27] text-white px-3 py-1 rounded-full text-xs shadow-md rotate-[-1deg]">
                                    {dish.priceNok} kr
                                  </span>

                                  {/* Top-Right Rating pill + Bookmark */}
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <span className="bg-black/60 backdrop-blur-md text-amber-400 font-bold px-2.5 py-1 rounded-full text-xs border border-white/10 flex items-center gap-1 shadow-xs">
                                      <span className="text-amber-400 text-xs">★</span>
                                      <span className="font-sans font-bold text-white text-xs tracking-tight">
                                        {dish.rating}
                                      </span>
                                    </span>
                                    <span className="p-1.5 rounded-full bg-black/60 text-white border border-white/10 backdrop-blur-md flex items-center justify-center shadow-xs">
                                      <Bookmark className="w-3 h-3" />
                                    </span>
                                  </div>
                                </div>

                                {/* Overlaid Editorial Content in lower portion */}
                                <div className="absolute bottom-0 inset-x-0 p-3 z-10 flex flex-col justify-end">
                                  <h3 className="font-bold text-base leading-snug drop-shadow-sm text-white line-clamp-1 capitalize">
                                    {dish.dishName}
                                  </h3>
                                  <div className="text-xs font-medium text-zinc-300 drop-shadow-sm mt-0.5 flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3 text-[#e84a27] shrink-0" />
                                    <span className="font-semibold text-white">{dish.spotName}</span>
                                    <span className="text-zinc-400">·</span>
                                    <span>{dish.neighborhood}</span>
                                    <span className="text-emerald-400 font-semibold font-mono text-[11px]">
                                      · {dish.walkTime}
                                    </span>
                                  </div>

                                  {/* Concise Dish Verdict Quote */}
                                  <div className="bg-black/45 backdrop-blur-md border border-white/15 rounded-xl px-2.5 py-1.5 my-1.5 max-w-[96%]">
                                    <p className="text-[11px] text-zinc-100 leading-snug line-clamp-2">
                                      <span className="text-[#E84A27] font-bold not-italic mr-1">✦</span>
                                      <span className="italic">&ldquo;{dish.verdict}&rdquo;</span>
                                    </p>
                                  </div>

                                  {/* Author & Actions Footer */}
                                  <div className="flex items-center justify-between gap-1.5 pt-1 mt-0.5">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-white/25 overflow-hidden shrink-0 flex items-center justify-center">
                                        <OfficialSmakrMascot size={24} />
                                      </span>
                                      <span className="text-[11px] font-semibold text-zinc-200 truncate">
                                        @smak
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <div className="h-7 px-2.5 rounded-full text-xs font-bold flex items-center gap-1 bg-[#181615]/75 border border-white/20 text-[#FAF7F2]">
                                        <Flame className="w-3 h-3 text-[#E84A27]" />
                                        <span className="font-mono text-[11px]">{dish.likes}</span>
                                      </div>
                                      <div className="h-7 w-7 rounded-full bg-[#181615]/75 border border-white/20 text-[#FAF7F2] flex items-center justify-center">
                                        <Send className="w-3 h-3 stroke-[2]" />
                                      </div>
                                      <div className="h-7 px-2.5 rounded-full bg-[#FAF7F2] text-[#181615] border-2 border-[#181615] shadow-[0_2px_0_#181615] text-[11px] font-extrabold flex items-center gap-1">
                                        <Compass className="w-3 h-3 stroke-[2.2]" />
                                        <span>Map</span>
                                        <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 6. VENUE DETAIL SHEET — mirrors VenueBottomSheet on mobile: a dimmed,
                      blurred backdrop over map + feed, with an 88dvh sheet on top. */}
                  <AnimatePresence>
                    {anim.showRestaurantDetailSheet && (
                      <motion.div
                        key="venue-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="absolute inset-0 z-[34] bg-black/40 backdrop-blur-sm"
                      />
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {anim.showRestaurantDetailSheet && (
                      <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-x-0 bottom-0 h-[750px] z-[35] bg-[#fbf9f5] rounded-t-3xl border-t border-black/10 shadow-2xl flex flex-col overflow-hidden"
                      >
                        {/* 1. Header Bar with Grab Handle & Venue Meta matching VenueBottomSheet */}
                        <div className="w-full flex flex-col items-center pt-2.5 pb-2.5 px-4 bg-[#fbf9f5] border-b border-black/[0.06] shrink-0 select-none">
                          <div className="w-10 h-1 rounded-full bg-zinc-300 mb-2" />

                          <div className="w-full flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="font-comico text-xl sm:text-2xl text-zinc-950 tracking-tight leading-tight truncate">
                                Ochaya - The Matcha
                              </h3>
                              <p className="text-[11px] text-zinc-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                <MapPin className="w-3.5 h-3.5 text-[#e84a27] shrink-0" />
                                <span className="font-medium text-zinc-700">
                                  Bernt Ankers gate 6a, Sentrum
                                </span>
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                              <div className="p-1.5 rounded-full bg-zinc-200/80 text-zinc-700 flex items-center justify-center">
                                <Share2 className="w-3.5 h-3.5 text-zinc-700" />
                              </div>
                              <div className="p-1.5 rounded-full bg-zinc-200/80 text-zinc-700 flex items-center justify-center">
                                <X className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 2. Scrollable Body with smooth animated scroll */}
                        <div className="flex-1 overflow-hidden p-4 text-xs no-scrollbar">
                          <div
                            style={{
                              transform: `translate3d(0, -${anim.menuScrollY}px, 0)`,
                              willChange: "transform",
                            }}
                            className="space-y-3.5"
                          >
                            {/* Cover Photo with Authentic Badge */}
                          <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 shadow-xs shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src="/api/places/photos?ref=places%2FChIJ6a-l059vQUYRpmfUn8lBiKA%2Fphotos%2FAa-ngMae_VRJ02FUheDoIEHZ-GKvVg2EIo2Wt8XyOQZkyvHjKwNJ-XUS-oBSHzk7NRql3e75b_spwFJNoGBpHFf7sMcDiUWu5ZEWZ2dkJlm_vNIy0tgy4XO9ATH4MCCq12r_zjNDFaRtL6TzyEJVw63wwcT9PFsv-_NI8pY15n4rAOmMySjd8XUbhunSCpPOkufMP2afgE8RF-9LPsWgCnY5O-uweAfjrI5qq1Lwcsa4L1RxS2oUoRDMQGWrTHVdudsLod_8if_nQwaFVtILqG1zi0bX8BUGc6AGVh-D-shiDsKToRodwVzO45OjhPOSyxWCxBgOPyxtd_MzEwOjZMLhqamQdjkXRLEtMjO9ikXNOFjv4wGDeDb7BVg_MYpASRk5k2nKuRkoNe7Fv0lGzc7cK4GktmiMv275qCS4hJK-jZ1B5g&i=0&w=600"
                              alt="Ochaya - The Matcha"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white">
                              <span className="font-bold text-xs tracking-tight drop-shadow-sm">
                                Matcha &amp; Japanese Tea House
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-mono font-bold border border-white/20">
                                $$
                              </span>
                            </div>
                          </div>

                          {/* Quick Action Buttons (Directions + Log a Dish) */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 font-semibold text-xs shadow-2xs">
                              <span>Directions</span>
                              <ExternalLink className="w-3 h-3 text-zinc-400" />
                            </div>

                            <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#e84a27] text-white font-semibold text-xs shadow-md shadow-[#e84a27]/25">
                              <Plus className="w-3 h-3" />
                              <span>Log a Dish</span>
                            </div>
                          </div>

                          {/* Extra Quick Link */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-700">
                              <Globe className="w-3.5 h-3.5 text-zinc-500" />
                              <span>Website / Menu</span>
                              <ExternalLink className="w-2.5 h-2.5 text-zinc-400" />
                            </div>
                          </div>

                          {/* 4-Column Quick Stats (Rating / Price / Status / Area) */}
                          <div className="grid grid-cols-4 gap-1 p-2 rounded-2xl bg-zinc-50 border border-zinc-200/70 text-center">
                            <div>
                              <div className="text-[9px] text-zinc-400 uppercase font-mono tracking-wider">Rating</div>
                              <div className="flex items-center justify-center gap-0.5 mt-0.5">
                                <span className="text-amber-500 text-xs">★</span>
                                <span className="font-comico text-xs text-zinc-950 font-bold">4.9</span>
                              </div>
                            </div>
                            <div className="border-l border-zinc-200/80">
                              <div className="text-[9px] text-zinc-400 uppercase font-mono tracking-wider">Price</div>
                              <div className="font-mono font-bold text-xs text-zinc-900 mt-0.5">75–98 kr</div>
                            </div>
                            <div className="border-l border-zinc-200/80">
                              <div className="text-[9px] text-zinc-400 uppercase font-mono tracking-wider">Status</div>
                              <div className="flex items-center justify-center gap-1 mt-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span className="text-[11px] font-bold text-emerald-700">Open</span>
                              </div>
                            </div>
                            <div className="border-l border-zinc-200/80">
                              <div className="text-[9px] text-zinc-400 uppercase font-mono tracking-wider">Area</div>
                              <div className="font-semibold text-xs text-zinc-900 truncate mt-0.5 capitalize px-1">
                                Sentrum
                              </div>
                            </div>
                          </div>

                          {/* Authentic Dishes Mini-Feed */}
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-zinc-900 text-xs flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[#e84a27]" />
                                <span>Dishes You Can&apos;t Miss ({OCHAYA_VENUE_DISHES.length})</span>
                              </h4>
                              <span className="text-[9.5px] font-mono text-zinc-400">
                                Foodie Radar Verified
                              </span>
                            </div>

                            <div className="space-y-2.5">
                              {OCHAYA_VENUE_DISHES.map((dish) => (
                                <div
                                  key={dish.id}
                                  className="p-3 rounded-2xl bg-white border border-zinc-200/80 shadow-xs flex gap-3 hover:border-[#e84a27]/30 transition-all"
                                >
                                  {/* Dish Photo */}
                                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-100">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={dish.image}
                                      alt={dish.name}
                                      className="w-full h-full object-cover"
                                    />
                                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-xs text-white font-mono font-bold text-[9px]">
                                      {dish.priceNok} NOK
                                    </span>
                                  </div>

                                  {/* Details */}
                                  <div className="flex-1 flex flex-col justify-between min-w-0">
                                    <div>
                                      <div className="flex items-start justify-between gap-1.5">
                                        <h5 className="font-extrabold text-zinc-900 text-xs leading-snug truncate">
                                          {dish.name}
                                        </h5>
                                        <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold text-[9px] shrink-0 border border-amber-200/60">
                                          <span className="text-amber-500">★</span>
                                          <span className="font-mono">{dish.rating}</span>
                                        </div>
                                      </div>

                                      <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2 italic leading-relaxed">
                                        &ldquo;{dish.review}&rdquo;
                                      </p>

                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {dish.tags.map((tag) => (
                                          <span
                                            key={tag}
                                            className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[8.5px] font-medium"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    {/* 1-Tap Foodie Reactions */}
                                    <div className="pt-1.5 mt-1 border-t border-zinc-100 flex items-center justify-between text-[9px]">
                                      <div className="flex items-center gap-1">
                                        <span
                                          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border font-semibold ${
                                            dish.isCraving
                                              ? "bg-[#e84a27] text-white border-[#e84a27]"
                                              : "bg-zinc-50 text-zinc-600 border-zinc-200"
                                          }`}
                                        >
                                          <Flame className="w-2.5 h-2.5" />
                                          <span>Craving</span>
                                        </span>

                                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg border bg-zinc-50 text-zinc-600 border-zinc-200 font-semibold">
                                          <Star className="w-2.5 h-2.5 text-amber-500" />
                                          <span>Must Try</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                    )}
                  </AnimatePresence>

                  {/* 7. Real Floating Bottom Pill (`FoodViewSlider.tsx` exact match) */}
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-black/10 shadow-xl">
                      <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#e84a27] text-white text-xs font-semibold shadow-sm">
                        <Utensils className="w-3.5 h-3.5" />
                        <span className="tracking-tight">Feed</span>
                      </span>
                      <span className="w-9 h-9 rounded-full bg-zinc-900 text-white flex items-center justify-center shadow-md">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                      <span className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-500">
                        <MapPin className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>

                  {/* iOS Home Indicator */}
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 rounded-full bg-black/25 z-40 pointer-events-none" />

                  {/* 8. SIMULATED HAPTIC TOUCH CURSOR */}
                  <div
                    style={{
                      left: `${anim.cursorX}%`,
                      top: `${anim.cursorY}%`,
                    }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
                  >
                    {anim.showRipple && (
                      <span className="absolute -inset-4 rounded-full border-2 border-[#e84a27] bg-[#e84a27]/20 animate-ping" />
                    )}
                    <div
                      className={`w-9 h-9 rounded-full bg-white/85 backdrop-blur-md border-2 border-[#e84a27] shadow-[0_6px_18px_rgba(232,74,39,0.45)] flex items-center justify-center transition-transform duration-150 ${
                        anim.isPressed ? "scale-75 bg-[#e84a27]/30" : "scale-100"
                      }`}
                    >
                      <div className="w-2.5 h-2.5 rounded-full bg-[#e84a27]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* =============================================================== */}
            {/* LAYER 3B: SIGNATURE CATCHPHRASE UNDER THE PHONE                 */}
            {/* Pure Vector SVG with Die-Cut Vinyl Sticker Backing (Full Saturation) */}
            {/* Elevated to z-[40] to sit above the stage linen veil!           */}
            {/* =============================================================== */}
            <div
              style={{
                left: "50%",
                bottom: aspectMode === "9:16" ? "165px" : "28px",
                transform: `translate3d(-50%, 0, 0) scale(${anim.catchphraseScale})`,
                opacity: anim.catchphraseOpacity,
                zIndex: 40,
                willChange: "transform",
              }}
              className="absolute z-[40] flex justify-center pointer-events-none select-none"
            >
              <svg
                viewBox="0 0 560 140"
                className={`overflow-visible ${
                  aspectMode === "9:16" ? "w-[560px]" : "w-[440px]"
                }`}
                style={{
                  filter: "drop-shadow(0 8px 24px rgba(24,22,21,0.24))",
                }}
              >
                <defs>
                  {/* Continuous cursive handwriting stroke mask for "for the big backs" */}
                  <mask id="brush-write-mask" maskUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="560" height="140" fill="black" />
                    <path
                      d="M 32 64 C 34 76, 36 90, 38 98 C 46 80, 58 78, 68 80 C 78 82, 88 88, 98 80 C 108 76, 118 84, 132 86 C 140 78, 144 68, 146 64 C 148 76, 150 90, 152 98 C 160 84, 168 68, 172 64 C 174 80, 186 78, 198 84 C 204 94, 212 84, 222 84 C 230 84, 238 88, 246 88 C 256 86, 264 74, 268 64 C 270 82, 282 86, 296 84 C 304 92, 312 80, 318 82 C 324 94, 332 82, 342 82 C 352 84, 356 102, 362 108 C 370 102, 382 76, 388 64 C 390 82, 402 86, 416 84 C 424 92, 432 82, 442 82 C 452 86, 462 82, 472 82 C 480 86, 488 74, 492 64 C 494 82, 502 86, 512 84 C 518 92, 524 80, 532 80 C 538 84, 544 92, 552 94"
                      pathLength="1000"
                      fill="none"
                      stroke="white"
                      strokeWidth="48"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="1000"
                      strokeDashoffset={1000 * (1 - anim.writeProgress)}
                    />
                  </mask>

                  {/* Organic round brush mask for "✦ foodies" */}
                  <mask id="brush-foodies-mask" maskUnits="userSpaceOnUse">
                    <rect x="0" y="0" width="560" height="140" fill="black" />
                    <path
                      d="M 312 22 L 472 22"
                      pathLength="1000"
                      fill="none"
                      stroke="white"
                      strokeWidth="60"
                      strokeLinecap="round"
                      strokeDasharray="1000"
                      strokeDashoffset={1000 * (1 - anim.foodieBrushProgress)}
                    />
                  </mask>
                </defs>

                {/* 1. Main catchphrase: "for the" + "big backs" continuously written with stroke mask */}
                {anim.writeProgress > 0 && (
                  <g mask="url(#brush-write-mask)">
                    {/* "for the" white backing */}
                    <text
                      x="38"
                      y="98"
                      textAnchor="start"
                      style={{
                        fontFamily: "var(--font-comico), sans-serif",
                        fontSize: "42px",
                        fontWeight: 900,
                        letterSpacing: "0.06em",
                        fill: "#FFFFFF",
                        stroke: "#FFFFFF",
                        strokeWidth: "6px",
                        strokeLinejoin: "round",
                        strokeLinecap: "round",
                        paintOrder: "stroke fill",
                      }}
                    >
                      for the
                    </text>
                    {/* "for the" ink fill */}
                    <text
                      x="38"
                      y="98"
                      textAnchor="start"
                      style={{
                        fontFamily: "var(--font-comico), sans-serif",
                        fontSize: "42px",
                        fontWeight: 900,
                        letterSpacing: "0.06em",
                        fill: "#181615",
                      }}
                    >
                      for the
                    </text>

                    {/* "big backs" white backing */}
                    <text
                      x="265"
                      y="98"
                      textAnchor="start"
                      style={{
                        fontFamily: "var(--font-comico), sans-serif",
                        fontSize: "46px",
                        fontWeight: 900,
                        letterSpacing: "0.05em",
                        fill: "#FFFFFF",
                        stroke: "#FFFFFF",
                        strokeWidth: "6px",
                        strokeLinejoin: "round",
                        strokeLinecap: "round",
                        paintOrder: "stroke fill",
                      }}
                    >
                      big backs
                    </text>
                    {/* "big backs" ink fill */}
                    <text
                      x="265"
                      y="98"
                      textAnchor="start"
                      style={{
                        fontFamily: "var(--font-comico), sans-serif",
                        fontSize: "46px",
                        fontWeight: 900,
                        letterSpacing: "0.05em",
                        fill: "#181615",
                      }}
                    >
                      big backs
                    </text>
                  </g>
                )}

                {/* 2. Single confident strikethrough crossing out "big backs" ONCE */}
                {anim.scribbleProgress > 0 && (
                  <>
                    <path
                      d="M 255 75 C 340 70, 440 78, 528 73"
                      pathLength="100"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="100"
                      strokeDashoffset={100 * (1 - anim.scribbleProgress)}
                    />
                    <path
                      d="M 255 75 C 340 70, 440 78, 528 73"
                      pathLength="100"
                      fill="none"
                      stroke="#E84A27"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray="100"
                      strokeDashoffset={100 * (1 - anim.scribbleProgress)}
                    />
                  </>
                )}

                {/* 3. Tilted "✦ foodies" handwritten correction elevated above */}
                {anim.foodieBrushProgress > 0 && (
                  <g mask="url(#brush-foodies-mask)">
                    <g transform="translate(392, 22) rotate(-6)">
                      {/* Crisp white backing for "foodies" */}
                      <text
                        x="0"
                        y="0"
                        textAnchor="middle"
                        style={{
                          fontFamily: "var(--font-comico), sans-serif",
                          fontSize: "30px",
                          fontWeight: 900,
                          letterSpacing: "0.04em",
                          fill: "#FFFFFF",
                          stroke: "#FFFFFF",
                          strokeWidth: "6px",
                          strokeLinejoin: "round",
                          strokeLinecap: "round",
                          paintOrder: "stroke fill",
                        }}
                      >
                        ✦ foodies
                      </text>
                      {/* Saturated #E84A27 Burnt Paprika text */}
                      <text
                        x="0"
                        y="0"
                        textAnchor="middle"
                        style={{
                          fontFamily: "var(--font-comico), sans-serif",
                          fontSize: "30px",
                          fontWeight: 900,
                          letterSpacing: "0.04em",
                          fill: "#E84A27",
                        }}
                      >
                        ✦ foodies
                      </text>
                    </g>
                  </g>
                )}

                {/* 4. Curved Arrow pointing down from foodies to the scribble */}
                {anim.arrowProgress > 0 && (
                  <>
                    <path
                      d="M 430 32 C 452 42, 458 52, 450 64 M 442 56 L 450 64 L 458 54"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={75}
                      strokeDashoffset={75 * (1 - anim.arrowProgress)}
                    />
                    <path
                      d="M 430 32 C 452 42, 458 52, 450 64 M 442 56 L 450 64 L 458 54"
                      fill="none"
                      stroke="#E84A27"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeDasharray={75}
                      strokeDashoffset={75 * (1 - anim.arrowProgress)}
                    />
                  </>
                )}

                {/* 5. Realistic Animated Vector Pencil (ONLY APPEARS TO SCRIBBLE OVER "BIG BACKS") */}
                {anim.pencilOpacity > 0 && (
                  <g
                    transform={`translate(${anim.pencilX}, ${anim.pencilY}) rotate(${anim.pencilAngle})`}
                    opacity={anim.pencilOpacity}
                    style={{ filter: "drop-shadow(-3px 5px 6px rgba(0,0,0,0.32))" }}
                  >
                    {/* Graphite Lead Tip */}
                    <polygon points="0,0 -3,-8 3,-8" fill="#181615" />
                    {/* Sharpened Cedar Collar */}
                    <polygon points="-3,-8 3,-8 5,-17 -5,-17" fill="#F3D19C" />
                    {/* Hexagon Body in Burnt Paprika */}
                    <rect x="-5" y="-62" width="10" height="45" rx="1.5" fill="#E84A27" />
                    {/* Facet Line */}
                    <line x1="0" y1="-62" x2="0" y2="-17" stroke="#C93B1B" strokeWidth="1.2" />
                    {/* Polished Silver Ferrule */}
                    <rect x="-5" y="-70" width="10" height="8" fill="#D1D5DB" />
                    <line x1="-5" y1="-66" x2="5" y2="-66" stroke="#9CA3AF" strokeWidth="0.8" />
                    {/* Pink Rubber Eraser */}
                    <path d="M -5 -70 C -5 -78, 5 -78, 5 -70 Z" fill="#F472B6" />
                  </g>
                )}
              </svg>
            </div>

            {/* =============================================================== */}
            {/* LAYER 4: UNIFIED MASCOT + ATTACHED SPEECH BUBBLE COLUMN         */}
            {/* Positioned on left, cleanly moved away from the phone!          */}
            {/* =============================================================== */}
            <div
              style={{
                left: 0,
                transform: `translate3d(${anim.mascotX}px, 0, 0) scale(${anim.mascotScale})`,
                transformOrigin: "bottom center",
                willChange: "transform",
              }}
              className={`absolute z-30 flex flex-col items-center pointer-events-none ${
                aspectMode === "9:16"
                  ? "bottom-[370px] w-[390px]"
                  : "bottom-[96px] w-[620px]"
              }`}
            >
              {/* Speech Bubble — Attached right above Mascot's head! */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={`scene-${activeScene.id}`}
                  initial={{ opacity: 0, y: 14, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full rounded-[28px] bg-[#FAF7F2] border border-white/90 shadow-[0_22px_50px_rgba(24,22,21,0.22)] p-5 mb-2 text-center"
                >
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e84a27]/12 text-[#e84a27] text-xs font-extrabold tracking-wider uppercase mb-2">
                    <span>{activeScene.badge}</span>
                  </div>

                  <p
                    className={`font-comico text-[#181615] leading-[1.18] tracking-tight ${
                      aspectMode === "9:16" ? "text-[28px]" : "text-[32px]"
                    }`}
                  >
                    {activeScene.speech}
                  </p>

                  <p className="mt-2 text-xs font-bold text-stone-600 flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#e84a27] shrink-0" />
                    <span>{activeScene.subtext}</span>
                  </p>

                  {/* Speech Bubble Tail pointing directly down to Mascot's head */}
                  <div
                    className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-7 h-7 bg-[#FAF7F2] rotate-45 border-r border-b border-black/5"
                  />
                </motion.div>
              </AnimatePresence>

              {/* Official Smakr Mascot Rig (`SmakrMascotRig`) — Enlarged to 510px, inline with phone */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                className="relative drop-shadow-[0_24px_44px_rgba(24,22,21,0.32)]"
              >
                <div
                  className={`flex items-end justify-center overflow-visible w-full ${
                    aspectMode === "9:16" ? "min-h-[500px]" : "h-[350px]"
                  }`}
                >
                  <SmakrMascotRig
                    frameMode="bust-only"
                    bodyPose={activeScene.pose}
                    face={activeScene.face}
                    head={OFFICIAL_SMAKR_MASCOT_CONFIG.peepsHead}
                    accessories="glasses-2"
                    facialHair="none"
                    skinColor={OFFICIAL_SMAKR_MASCOT_CONFIG.skinColor}
                    clothingColor={OFFICIAL_SMAKR_MASCOT_CONFIG.topColor}
                    innerClothingColor={OFFICIAL_SMAKR_MASCOT_CONFIG.bottomColor}
                    hatColor={OFFICIAL_SMAKR_MASCOT_CONFIG.hatColor}
                    headContrastColor={OFFICIAL_SMAKR_MASCOT_CONFIG.hairColor}
                    size={aspectMode === "9:16" ? 510 : 360}
                    stickerOutline
                  />
                </div>
              </motion.div>

              {/* Clean Warm Frosted Beta CTA Pill — strictly visible in Act 3 closer! */}
              <div
                style={{
                  opacity: anim.betaBubbleOpacity,
                  transform: `translate3d(0, ${anim.betaBubbleY}px, 0)`,
                  pointerEvents: anim.betaBubbleOpacity > 0.5 ? "auto" : "none",
                }}
                className="transition-all duration-300 -mt-3 flex justify-center w-full"
              >
                <motion.div
                  animate={
                    anim.showBetaCtaHighlight
                      ? { scale: [1, 1.05, 1] }
                      : { scale: 1 }
                  }
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className={`inline-flex items-center gap-2.5 px-6 py-3 rounded-full backdrop-blur-xl border shadow-[0_14px_34px_rgba(24,22,21,0.20)] transition-colors ${
                    anim.showBetaCtaHighlight
                      ? "bg-[#e84a27] text-white border-white/40"
                      : "bg-[#FAF7F2]/95 text-[#181615] border-white/90"
                  }`}
                >
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                      anim.showBetaCtaHighlight
                        ? "bg-white text-[#e84a27]"
                        : "bg-[#e84a27] text-white"
                    }`}
                  >
                    BETA
                  </span>
                  <span className="text-base font-extrabold tracking-tight">
                    Comment &ldquo;beta test&rdquo; · smakr.no
                  </span>
                </motion.div>
              </div>
            </div>

            {/* =============================================================== */}
            {/* LAYER 5: INSTAGRAM REELS SAFE-ZONE OVERLAY (Toggleable)         */}
            {/* =============================================================== */}
            {showSafeZone && aspectMode === "9:16" && (
              <div className="absolute inset-0 z-50 pointer-events-none">
                <div className="absolute top-0 inset-x-0 h-[150px] bg-red-500/20 border-b-2 border-dashed border-red-400 flex items-center justify-center">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-red-900 bg-white/90 px-3 py-1 rounded-full">
                    IG Reels Top Safe Zone (150px)
                  </span>
                </div>
                <div className="absolute bottom-0 inset-x-0 h-[260px] bg-red-500/20 border-t-2 border-dashed border-red-400 flex items-center justify-center">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-red-900 bg-white/90 px-3 py-1 rounded-full">
                    IG Reels Bottom Caption & Audio Safe Zone (260px)
                  </span>
                </div>
                <div className="absolute top-[150px] bottom-[260px] right-0 w-[120px] bg-red-500/20 border-l-2 border-dashed border-red-400 flex items-center justify-center">
                  <span className="-rotate-90 whitespace-nowrap text-xs font-mono font-bold uppercase tracking-widest text-red-900 bg-white/90 px-3 py-1 rounded-full">
                    IG Likes / Share Rail (120px)
                  </span>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* LAYER 6: 3... 2... 1... GO RECORD MODE COUNTDOWN OVERLAY        */}
            {/* =============================================================== */}
            <AnimatePresence>
              {countdown !== null && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-black/65 backdrop-blur-md flex flex-col items-center justify-center text-white"
                >
                  <motion.div
                    key={countdown}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.3, opacity: 0 }}
                    className="font-comico text-[150px] text-[#e84a27] drop-shadow-lg"
                  >
                    {countdown === 0 ? "GO" : countdown}
                  </motion.div>
                  <p className="text-lg font-bold text-white/80 mt-4">
                    Screen recording starts at 0.0s · Press ESC anytime to show controls
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Persistent HTML Audio Element for Soundtrack Playback & MediaRecorder Capture */}
      <audio
        ref={audioElRef}
        src={activeTrack.src || undefined}
        preload="auto"
        loop
        crossOrigin="anonymous"
        className="hidden"
      />
    </div>
  );
}
