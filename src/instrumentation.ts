import type { Instrumentation } from "next";

// One JSON line per server error, for whatever collects stdout. Never log
// request headers or cookies: they carry the session cookie.
export const onRequestError: Instrumentation.onRequestError = (err, request, context) => {
  console.error(
    JSON.stringify({
      level: "error",
      message: err instanceof Error ? err.message : String(err),
      digest: typeof err === "object" && err !== null && "digest" in err ? String(err.digest) : undefined,
      path: request.path.split("?")[0],
      method: request.method,
      routeType: context.routeType,
    })
  );
};
