import { randomUUID } from "crypto";
import { PostHog } from "posthog-node";

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (process.env.NODE_ENV !== "production") {
  if (!posthogToken) {
    console.warn(
      "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured"
    );
  }
  if (!posthogHost) {
    console.warn(
      "NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_HOST is configured"
    );
  }
}

const posthog =
  posthogToken && posthogHost
    ? new PostHog(posthogToken, {
        host: posthogHost,
        flushAt: 1,
        flushInterval: 0,
        requestTimeout: 2000,
        fetchRetryCount: 0,
        privacyMode: false,
      })
    : null;

export function createAiTraceId(): string {
  return randomUUID();
}

interface CaptureGeminiGenerationParams {
  traceId: string;
  distinctId?: string;
  spanName: string;
  model: string;
  input: unknown;
  output?: unknown;
  temperature?: number;
  latencyMs: number;
  status?: number;
  error?: unknown;
}

export async function captureGeminiGeneration({
  traceId,
  distinctId,
  spanName,
  model,
  input,
  output,
  temperature,
  latencyMs,
  status,
  error,
}: CaptureGeminiGenerationParams): Promise<void> {
  if (!posthog) return;

  try {
    posthog.capture({
      distinctId: distinctId || "anonymous",
      event: "$ai_generation",
      properties: {
        $ai_trace_id: traceId,
        $ai_session_id: null,
        $ai_span_id: randomUUID(),
        $ai_span_name: spanName,
        $ai_model: model,
        $ai_provider: "gemini",
        $ai_input: input,
        $ai_output_choices:
          output === undefined ? undefined : [{ role: "assistant", content: output }],
        $ai_latency: latencyMs / 1000,
        $ai_temperature: temperature,
        $ai_http_status: status,
        $ai_is_error: Boolean(error) || (status !== undefined && status >= 400),
        $ai_error: error ? String(error) : undefined,
      },
    });
    await posthog.flush().catch(() => {});
  } catch {
    // AI observability must not affect the LLM call or its response.
  }
}
