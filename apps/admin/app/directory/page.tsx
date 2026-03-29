import { createClient } from "@repo/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";
import { Globe, MapPin, Search, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Global Coach Directory — WIAL",
  description:
    "Find certified Action Learning coaches worldwide. Browse by certification level, language, or location.",
};

const certColors: Record<string, { bg: string; text: string; border: string }> = {
  CALC: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  SALC: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  MALC: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  PALC: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
};

export default async function GlobalDirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ cert?: string; lang?: string; country?: string; q?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const { data: coaches } = await supabase
    .from("global_coaches")
    .select("*")
    .order("full_name");

  let filtered = coaches ?? [];

  if (params.cert) {
    filtered = filtered.filter((c) => c.certification_level === params.cert);
  }
  if (params.lang) {
    filtered = filtered.filter((c) =>
      c.languages?.some((l: string) => l.toLowerCase() === params.lang!.toLowerCase())
    );
  }
  if (params.country) {
    filtered = filtered.filter(
      (c) => c.country?.toLowerCase() === params.country!.toLowerCase()
    );
  }
  if (params.q) {
    const q = params.q.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.specializations?.some((s: string) => s.toLowerCase().includes(q)) ||
        c.city?.toLowerCase().includes(q) ||
        c.country?.toLowerCase().includes(q)
    );
  }

  // Collect filter options from ALL coaches (not filtered)
  const allCoaches = coaches ?? [];
  const allLanguages = [...new Set(allCoaches.flatMap((c) => c.languages ?? []))].sort();
  const allCountries = [...new Set(allCoaches.map((c) => c.country).filter(Boolean))].sort();
  const allChapters = [...new Set(allCoaches.map((c) => c.chapter_name).filter(Boolean))].sort();

  function buildFilterUrl(overrides: Record<string, string | undefined>) {
    const p = { ...params, ...overrides };
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(p)) {
      if (v) sp.set(k, v);
    }
    const qs = sp.toString();
    return `/directory${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[#1A7A8A] flex items-center justify-center">
              <Globe className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg text-[#2C2C2C]" style={{ fontFamily: "var(--font-lexend), sans-serif" }}>
                WIAL
              </p>
              <p className="text-xs text-[#6B6B6B]">Global Coach Directory</p>
            </div>
          </Link>
          <Link
            href="/login"
            className="text-sm text-[#1A7A8A] hover:underline font-medium"
          >
            Admin Login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#1A7A8A]/5 to-transparent py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
          <h1
            className="text-4xl md:text-5xl font-bold text-[#2C2C2C] mb-4"
            style={{ fontFamily: "var(--font-lexend), sans-serif" }}
          >
            Find a Certified Coach
          </h1>
          <p className="text-lg text-[#6B6B6B] max-w-2xl mx-auto mb-8">
            Browse our global network of certified Action Learning coaches across{" "}
            {allChapters.length} chapters worldwide.
          </p>

          {/* Search */}
          <form action="/directory" method="get" className="max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#6B6B6B]" />
              <input
                type="text"
                name="q"
                defaultValue={params.q ?? ""}
                placeholder="Search by name, specialization, or location..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#E0DDD8] bg-white text-[#2C2C2C] placeholder-[#A0A0A0] focus:outline-none focus:border-[#1A7A8A] focus:ring-2 focus:ring-[#1A7A8A]/20"
              />
              {/* Preserve existing filters */}
              {params.cert && <input type="hidden" name="cert" value={params.cert} />}
              {params.lang && <input type="hidden" name="lang" value={params.lang} />}
              {params.country && <input type="hidden" name="country" value={params.country} />}
            </div>
          </form>
        </div>
      </section>

      {/* Filters + Results */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-sm text-[#6B6B6B] mr-1">Filter:</span>

          {/* Certification levels */}
          {["CALC", "SALC", "MALC", "PALC"].map((level) => {
            const c = certColors[level]!;
            const active = params.cert === level;
            return (
              <Link
                key={level}
                href={buildFilterUrl({ cert: active ? undefined : level })}
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  active
                    ? `${c.bg} ${c.text} ${c.border}`
                    : "border-[#E0DDD8] text-[#6B6B6B] hover:border-[#1A7A8A] hover:text-[#1A7A8A]"
                }`}
              >
                {level}
              </Link>
            );
          })}

          <span className="mx-1 h-4 w-px bg-[#E0DDD8]" />

          {/* Language filter */}
          {allLanguages.length > 0 &&
            allLanguages.map((l) => {
              const active = params.lang === l;
              return (
                <Link
                  key={l}
                  href={buildFilterUrl({ lang: active ? undefined : l })}
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    active
                      ? "bg-[#1A7A8A]/10 text-[#1A7A8A] border-[#1A7A8A]/30"
                      : "border-[#E0DDD8] text-[#6B6B6B] hover:border-[#1A7A8A] hover:text-[#1A7A8A]"
                  }`}
                >
                  {l}
                </Link>
              );
            }).slice(0, 8)}

          {allLanguages.length > 8 && !params.lang && (
            <span className="text-xs text-[#A0A0A0]">+{allLanguages.length - 8} more</span>
          )}

          {/* Clear filters */}
          {(params.cert || params.lang || params.country || params.q) && (
            <Link
              href="/directory"
              className="text-xs text-[#1A7A8A] hover:underline ml-2"
            >
              Clear all
            </Link>
          )}
        </div>

        {/* Results count */}
        <p className="text-sm text-[#6B6B6B] mb-6">
          {filtered.length} coach{filtered.length !== 1 ? "es" : ""} found
          {(params.cert || params.lang || params.country || params.q) && " (filtered)"}
        </p>

        {/* Coach Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((coach) => {
              const initials = coach.full_name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const c = certColors[coach.certification_level] ?? {
                bg: "bg-gray-50",
                text: "text-gray-700",
                border: "border-gray-200",
              };
              const location = [coach.city, coach.country].filter(Boolean).join(", ");
              const chapterUrl = coach.chapter_slug
                ? `https://${coach.chapter_slug}.wial.ashwanthbk.com`
                : null;

              return (
                <div
                  key={coach.id}
                  className="bg-white rounded-xl border border-[#E0DDD8] overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Photo */}
                  <div className="aspect-[4/3] bg-[#F5F3EE] overflow-hidden relative">
                    {coach.photo_url ? (
                      <img
                        src={coach.photo_url}
                        alt={coach.full_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-4xl font-bold text-white"
                        style={{
                          background: `linear-gradient(135deg, ${coach.certification_level === "CALC" ? "#3b82f6" : coach.certification_level === "SALC" ? "#16a34a" : coach.certification_level === "MALC" ? "#d97706" : "#7c3aed"}dd, ${coach.certification_level === "CALC" ? "#3b82f6" : coach.certification_level === "SALC" ? "#16a34a" : coach.certification_level === "MALC" ? "#d97706" : "#7c3aed"}88)`,
                        }}
                      >
                        {initials}
                      </div>
                    )}
                    {/* Cert badge */}
                    <span
                      className={`absolute top-3 right-3 ${c.bg} ${c.text} ${c.border} border rounded-full px-2.5 py-0.5 text-xs font-semibold`}
                    >
                      {coach.certification_level}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3
                      className="font-semibold text-[#2C2C2C] mb-1"
                      style={{ fontFamily: "var(--font-lexend), sans-serif" }}
                    >
                      {coach.full_name}
                    </h3>

                    {location && (
                      <p className="text-xs text-[#6B6B6B] flex items-center gap-1 mb-2">
                        <MapPin className="h-3 w-3" />
                        {location}
                      </p>
                    )}

                    {coach.chapter_name && (
                      <p className="text-xs text-[#1A7A8A] mb-2">
                        {coach.chapter_name}
                      </p>
                    )}

                    {coach.languages?.length > 0 && (
                      <p className="text-xs text-[#6B6B6B] mb-3">
                        {(coach.languages as string[]).join(" \u00B7 ")}
                      </p>
                    )}

                    {coach.specializations?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(coach.specializations as string[]).slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 text-[10px] rounded-full bg-[#F5F3EE] text-[#6B6B6B] border border-[#E0DDD8]"
                          >
                            {s}
                          </span>
                        ))}
                        {coach.specializations.length > 3 && (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-[#F5F3EE] text-[#A0A0A0]">
                            +{coach.specializations.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Link to chapter site profile */}
                    {chapterUrl && (
                      <a
                        href={`${chapterUrl}/en/coaches/${coach.id}-${coach.full_name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1A7A8A] hover:text-[#D4A900] transition-colors"
                      >
                        View Profile
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="h-16 w-16 text-[#A0A0A0] mb-4" />
            <h3
              className="text-lg font-semibold text-[#2C2C2C] mb-2"
              style={{ fontFamily: "var(--font-lexend), sans-serif" }}
            >
              No coaches found
            </h3>
            <p className="text-sm text-[#6B6B6B] mb-4">
              Try adjusting your filters or search terms.
            </p>
            <Link
              href="/directory"
              className="text-sm font-medium text-[#1A7A8A] hover:underline"
            >
              Clear all filters
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t bg-white mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 text-center">
          <p className="text-sm text-[#6B6B6B]">
            World Institute for Action Learning (WIAL)
          </p>
        </div>
      </footer>
    </div>
  );
}
