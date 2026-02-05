const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

function isLoopbackHostname(hostname: string) {
  return LOOPBACK_HOSTS.has(hostname);
}

export function resolveGoogleRedirectUri(requestUrl: string) {
  const request = new URL(requestUrl);
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim();

  if (!configured) {
    return new URL("/api/google/callback", request.origin).toString();
  }

  let configuredUrl: URL;
  try {
    configuredUrl = new URL(configured);
  } catch {
    throw new Error("GOOGLE_REDIRECT_URI must be a valid absolute URL.");
  }

  if (
    isLoopbackHostname(configuredUrl.hostname) &&
    isLoopbackHostname(request.hostname)
  ) {
    configuredUrl.protocol = request.protocol;
    configuredUrl.hostname = request.hostname;
    configuredUrl.port = request.port;
  }

  return configuredUrl.toString();
}
