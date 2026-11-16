import fs from "fs";
import { buildOpenPeepsSvg, DEFAULT_OPEN_PEEPS_CONFIG } from "../src/lib/onboardingAvatar.js";

// Let's test stripping bust and positioning head
let headSvg = buildOpenPeepsSvg(DEFAULT_OPEN_PEEPS_CONFIG);
// Remove bust group
headSvg = headSvg.replace(/<g data-layer="open-peeps-bust"[\s\S]*?<\/g>\s*<\/g>/gi, "");
headSvg = headSvg.replace(/<mask[^>]*id="viewboxMask"[^>]*>[\s\S]*?<\/mask>/gi, "");
headSvg = headSvg.replace(/\s*mask="url\(#viewboxMask\)"/gi, "");

// Extract inner elements between <svg ...> and </svg>
const innerMatch = headSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
const innerContent = innerMatch ? innerMatch[1] : "";

console.log("Inner content length:", innerContent.length);
