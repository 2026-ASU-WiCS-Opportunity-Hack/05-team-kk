export function getBearerToken(req: Request): string | null {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return authHeader.trim() || null;
}

export function getUserIdFromJwt(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as { sub?: unknown };

    return typeof payload.sub === "string" && payload.sub.length > 0
      ? payload.sub
      : null;
  } catch {
    return null;
  }
}
