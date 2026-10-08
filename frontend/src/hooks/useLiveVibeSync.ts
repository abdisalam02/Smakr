"use client";

import { useEffect, useRef } from "react";
import { useCityPulseStore } from "@/store/useCityPulseStore";
import { LiveRadarEvent } from "@/types";

/**
 * Live vibe streaming is OPT-IN. It is disabled unless
 * `NEXT_PUBLIC_ENABLE_LIVE_VIBES === "true"` so local development never spawns
 * a failing `ws://localhost:8001/...` connection (and its reconnect loop) when
 * the FastAPI backend isn't running.
 */
const LIVE_VIBES_ENABLED =
  typeof process !== "undefined" &&
  process.env?.NEXT_PUBLIC_ENABLE_LIVE_VIBES === "true";

function getWsUrl() {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${host}:8001/api/v1/ws/live`;
  }
  return "ws://localhost:8001/api/v1/ws/live";
}

export function useLiveVibeSync() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateVenueVibe = useCityPulseStore((state) => state.updateVenueVibe);
  const setWsConnected = useCityPulseStore((state) => state.setWsConnected);
  const setLastEvent = useCityPulseStore((state) => state.setLastEvent);

  useEffect(() => {
    // Feature flag off (default) → skip entirely: no socket, no reconnect loop,
    // no console noise.
    if (!LIVE_VIBES_ENABLED) {
      setWsConnected(false);
      return;
    }

    let isMounted = true;

    function connect() {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        return;
      }

      try {
        const ws = new WebSocket(getWsUrl());
        wsRef.current = ws;

        ws.onopen = () => {
          if (isMounted) setWsConnected(true);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const msg: LiveRadarEvent = JSON.parse(event.data);
            setLastEvent(msg);

            if (msg.type === "vibe_updated" && msg.data) {
              updateVenueVibe(msg.data.venue_id, msg.data.vibe, msg.data.new_checkin);
            } else if (msg.type === "speedtest_logged" && msg.data) {
              updateVenueVibe(msg.data.venue_id, msg.data.vibe, undefined, msg.data.speed_test);
            }
          } catch (err) {
            console.warn("Failed to parse WebSocket message:", err);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setWsConnected(false);
          // Reconnect with a 3s backoff.
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) connect();
          }, 3000);
        };

        ws.onerror = () => {
          // Avoid the uncaught-error noise; onclose handles the retry.
          ws.close();
        };
      } catch (err) {
        console.warn("WebSocket init error:", err);
      }
    }

    connect();

    // Periodic ping to keep alive.
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);

    return () => {
      isMounted = false;
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [updateVenueVibe, setWsConnected, setLastEvent]);
}
