import dns from "dns/promises";
import net from "net";
import { isDeliveryAppImageUrl } from "@/lib/admin/imageSource";

export const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const DEFAULT_MAX_BYTES = 8 * 1024 * 1024; // 8 MiB safety cap

export function isPrivateIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) {
    const parts = ip.split(".").map(Number);
    if (parts.length !== 4 || parts.some(Number.isNaN)) return true;
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }
  if (family === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("::ffff:")) {
      const mapped = lower.slice("::ffff:".length);
      if (net.isIP(mapped) === 4) return isPrivateIp(mapped);
    }
    return false;
  }
  return true;
}

export async function assertPublicHttpUrl(rawUrl: string): Promise<URL> {
  const parsed = new URL(rawUrl.trim());
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http/https URLs are supported.");
  }
  const host = parsed.hostname.toLowerCase();
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new Error("Blocked private host.");
  }
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error("Blocked private IP.");
    return parsed;
  }
  const records = await dns.lookup(host, { all: true });
  if (!records.length || records.some((r) => isPrivateIp(r.address))) {
    throw new Error("Blocked private DNS resolution.");
  }
  return parsed;
}

export interface SafeRemoteImageResult {
  buffer: Buffer;
  contentType: string;
}

/**
 * Downloads an external HTTP(S) image safely with SSRF checks, manual redirect
 * hops, optional Referer header to pass hotlink guards, and MIME validation.
 */
export async function fetchSafeRemoteImage(
  url: string,
  opts?: { referer?: string; maxBytes?: number; timeoutMs?: number }
): Promise<SafeRemoteImageResult | null> {
  try {
    if (!url || isDeliveryAppImageUrl(url)) return null;
    let currentUrl = await assertPublicHttpUrl(url);
    if (/lookaside\.(instagram|fbsbx)\.com/i.test(currentUrl.hostname)) {
      return null;
    }

    const headers: Record<string, string> = {
      "User-Agent": BROWSER_UA,
      Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    };
    const referer = (opts?.referer || "").trim();
    if (referer && /^https?:\/\//i.test(referer)) {
      headers.Referer = referer;
    }

    let res: Response | null = null;
    const timeoutMs = opts?.timeoutMs ?? 8000;
    for (let hop = 0; hop <= 3; hop++) {
      res = await fetch(currentUrl.toString(), {
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
        headers,
      });

      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location || hop === 3) return null;
        const nextResolved = new URL(location, currentUrl).toString();
        if (isDeliveryAppImageUrl(nextResolved)) return null;
        currentUrl = await assertPublicHttpUrl(nextResolved);
        if (/lookaside\.(instagram|fbsbx)\.com/i.test(currentUrl.hostname)) {
          return null;
        }
        continue;
      }
      break;
    }
    if (!res || !res.ok) return null;

    const ct = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (ct.includes("text/html") || ct.includes("application/json") || ct.includes("text/plain")) {
      return null;
    }
    // Never stream active SVG scripts inline via preview proxy
    if (ct === "image/svg+xml") return null;

    const declaredLen = Number(res.headers.get("content-length") || 0);
    const maxBytes = opts?.maxBytes ?? DEFAULT_MAX_BYTES;
    if (declaredLen > maxBytes) return null;

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 128 || buf.length > maxBytes) return null;

    const safeContentType = /^image\/(jpeg|jpg|png|webp|gif|avif)$/i.test(ct)
      ? ct === "image/jpg"
        ? "image/jpeg"
        : ct
      : "image/jpeg";

    return { buffer: buf, contentType: safeContentType };
  } catch {
    return null;
  }
}
