import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const DEFAULT_AMOUNTS: Record<string, number> = {
  enrollment: 5000,    // $50.00
  certification: 3000, // $30.00
};

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 10;

// In-memory rate limiter (per Edge Function instance)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(chapterId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(chapterId);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(chapterId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: {
    chapter_id?: string;
    payment_type?: string;
    payer_email?: string;
    amount?: number;
    description?: string;
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { chapter_id, payment_type, payer_email, amount: bodyAmount, description } = body;

  if (!chapter_id || !payment_type || !payer_email) {
    return new Response(
      JSON.stringify({ error: "chapter_id, payment_type, and payer_email are required" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const validTypes = ["enrollment", "certification", "dues", "event"];
  if (!validTypes.includes(payment_type)) {
    return new Response(
      JSON.stringify({ error: `payment_type must be one of: ${validTypes.join(", ")}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payer_email)) {
    return new Response(JSON.stringify({ error: "Invalid payer_email" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check caller has chapter_lead or super_admin role
  const { data: callerRoles } = await supabase
    .from("user_roles")
    .select("role, chapter_id")
    .eq("user_id", user.id);

  const isSuperAdmin = callerRoles?.some((r) => r.role === "super_admin");
  const isChapterLead = callerRoles?.some(
    (r) => r.chapter_id === chapter_id && r.role === "chapter_lead"
  );

  if (!isSuperAdmin && !isChapterLead) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Rate limit: 10 checkouts/hour/chapter
  if (!checkRateLimit(chapter_id)) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Maximum 10 payment requests per hour per chapter." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Fetch chapter with Stripe account
  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, name, stripe_account_id, stripe_onboarding_complete")
    .eq("id", chapter_id)
    .single();

  if (!chapter) {
    return new Response(JSON.stringify({ error: "Chapter not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!chapter.stripe_account_id || !chapter.stripe_onboarding_complete) {
    return new Response(
      JSON.stringify({ error: "Chapter has not completed Stripe Connect onboarding" }),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Determine amount in cents
  let amountCents: number;
  if (payment_type === "enrollment") {
    amountCents = DEFAULT_AMOUNTS.enrollment;
  } else if (payment_type === "certification") {
    amountCents = DEFAULT_AMOUNTS.certification;
  } else {
    // dues and event require amount in body
    if (!bodyAmount || typeof bodyAmount !== "number" || bodyAmount <= 0) {
      return new Response(
        JSON.stringify({ error: "amount (in cents, > 0) is required for dues and event payment types" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    amountCents = Math.round(bodyAmount);
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const adminUrl = Deno.env.get("ADMIN_DASHBOARD_URL") ?? "https://wial-admin.vercel.app";

  if (!stripeKey) {
    return new Response(JSON.stringify({ error: "Stripe not configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create idempotency key
  const idempotencyKey = `${chapter_id}-${payment_type}-${payer_email}-${Date.now()}`;

  // Create Stripe Checkout Session via REST API
  const params = new URLSearchParams({
    "mode": "payment",
    "payment_method_types[]": "card",
    "customer_email": payer_email,
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": amountCents.toString(),
    "line_items[0][price_data][product_data][name]": description ?? `WIAL ${payment_type.charAt(0).toUpperCase() + payment_type.slice(1)} — ${chapter.name}`,
    "line_items[0][quantity]": "1",
    "payment_intent_data[transfer_data][destination]": chapter.stripe_account_id,
    "metadata[chapter_id]": chapter_id,
    "metadata[payment_type]": payment_type,
    "metadata[payer_email]": payer_email,
    "success_url": `${adminUrl}/dashboard/payments?success=1`,
    "cancel_url": `${adminUrl}/dashboard/payments?cancelled=1`,
  });

  let stripeSession: { id: string; url: string };

  try {
    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Idempotency-Key": idempotencyKey,
      },
      body: params.toString(),
    });

    if (!stripeRes.ok) {
      const errBody = await stripeRes.text();
      console.error("Stripe error:", errBody);
      return new Response(JSON.stringify({ error: "Failed to create payment session" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    stripeSession = await stripeRes.json();
  } catch (err) {
    console.error("Stripe network error:", err);
    return new Response(JSON.stringify({ error: "Network error contacting Stripe" }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Insert pending payment record (service role bypasses RLS)
  const { error: insertError } = await supabase.from("payments").insert({
    chapter_id,
    payer_email,
    payment_provider: "stripe",
    stripe_checkout_session_id: stripeSession.id,
    amount: amountCents,
    currency: "usd",
    payment_type,
    status: "pending",
    description: description ?? null,
    idempotency_key: idempotencyKey,
  });

  if (insertError) {
    console.error("Failed to insert payment record:", insertError);
    // Don't fail the user — the webhook will handle it
  }

  return new Response(JSON.stringify({ checkoutUrl: stripeSession.url, sessionId: stripeSession.id }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
