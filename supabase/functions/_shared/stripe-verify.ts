/**
 * Stripe webhook signature verification using Web Crypto API.
 * No Stripe SDK — manual HMAC-SHA256, timing-safe compare, 5-minute replay protection.
 */

export async function verifyStripeWebhook(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string
): Promise<void> {
  if (!signatureHeader) {
    throw new Error("Missing Stripe-Signature header");
  }

  // Parse header: t=timestamp,v1=signature,...
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const idx = part.indexOf("=");
      return [part.slice(0, idx), part.slice(idx + 1)];
    })
  );

  const timestamp = parts["t"];
  const v1Signature = parts["v1"];

  if (!timestamp || !v1Signature) {
    throw new Error("Invalid Stripe-Signature format");
  }

  // Replay protection: reject signatures older than 5 minutes
  const ts = parseInt(timestamp, 10);
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - ts) > 300) {
    throw new Error("Webhook timestamp too old (replay attack)");
  }

  // Compute HMAC-SHA256 of "timestamp.rawBody"
  const signedPayload = `${timestamp}.${rawBody}`;
  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(signedPayload)
  );

  // Convert computed signature to hex
  const computedHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Timing-safe comparison
  const expectedBytes = encoder.encode(v1Signature);
  const computedBytes = encoder.encode(computedHex);

  if (expectedBytes.length !== computedBytes.length) {
    throw new Error("Webhook signature mismatch");
  }

  let mismatch = 0;
  for (let i = 0; i < expectedBytes.length; i++) {
    mismatch |= expectedBytes[i]! ^ computedBytes[i]!;
  }

  if (mismatch !== 0) {
    throw new Error("Webhook signature mismatch");
  }
}
