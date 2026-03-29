"use client";

import { useEffect, useState, memo } from "react";
import { Badge } from "@repo/ui/badge";
import { useTranslations } from "next-intl";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Real lat/lng coordinates for WIAL chapter locations
const CHAPTERS = [
  { lng: -98.5, lat: 39.8, countryKey: "usa", coaches: 12, status: "active", iso: "USA" },
  { lng: 8.0, lat: 9.1, countryKey: "nigeria", coaches: 8, status: "active", iso: "NGA" },
  { lng: -51.9, lat: -14.2, countryKey: "brazil", coaches: 6, status: "active", iso: "BRA" },
  { lng: 10.4, lat: 51.2, countryKey: "germany", coaches: 5, status: "active", iso: "DEU" },
  { lng: 108.3, lat: 14.1, countryKey: "vietnam", coaches: 4, status: "active", iso: "VNM" },
  { lng: 121.8, lat: 12.9, countryKey: "philippines", coaches: 7, status: "active", iso: "PHL" },
  { lng: 78.9, lat: 20.6, countryKey: "india", coaches: 3, status: "active", iso: "IND" },
  { lng: 37.9, lat: -0.02, countryKey: "kenya", coaches: 5, status: "active", iso: "KEN" },
  { lng: 127.8, lat: 35.9, countryKey: "southKorea", coaches: 4, status: "active", iso: "KOR" },
] as const;

// Precompute connection pairs (connect chapters within ~6000km)
const CONNECTIONS: [number, number][] = [];
for (let i = 0; i < CHAPTERS.length; i++) {
  for (let j = i + 1; j < CHAPTERS.length; j++) {
    const a = CHAPTERS[i]!;
    const b = CHAPTERS[j]!;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const sinHalf =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const dist = 2 * 6371 * Math.asin(Math.sqrt(sinHalf));
    if (dist < 6000) {
      CONNECTIONS.push([i, j]);
    }
  }
}

const chapterIsoSet = new Set<string>(CHAPTERS.map((c) => c.iso));

const WorldMap = memo(function WorldMap({
  hoveredIndex,
  onHover,
  getCountryLabel,
  t,
}: {
  hoveredIndex: number | null;
  onHover: (i: number | null) => void;
  getCountryLabel: (key: (typeof CHAPTERS)[number]["countryKey"]) => string;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <ComposableMap
      projection="geoMercator"
      projectionConfig={{
        scale: 130,
        center: [15, 20],
      }}
      width={800}
      height={420}
      style={{ width: "100%", height: "100%" }}
    >
      <Geographies geography={GEO_URL}>
        {({ geographies }) =>
          geographies.map((geo) => {
            const iso = geo.properties.ISO_A3 ?? geo.id ?? "";
            const isChapterCountry = chapterIsoSet.has(iso);
            const hoveredChapter =
              hoveredIndex !== null ? CHAPTERS[hoveredIndex] : null;
            const isHoveredCountry =
              hoveredChapter && hoveredChapter.iso === iso;

            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={
                  isHoveredCountry
                    ? "oklch(var(--primary) / 0.25)"
                    : isChapterCountry
                      ? "oklch(var(--primary) / 0.12)"
                      : "oklch(var(--muted-foreground) / 0.08)"
                }
                stroke="oklch(var(--border) / 0.3)"
                strokeWidth={0.4}
                style={{
                  default: { outline: "none", transition: "fill 0.2s" },
                  hover: { outline: "none", fill: isChapterCountry ? "oklch(var(--primary) / 0.2)" : "oklch(var(--muted-foreground) / 0.12)" },
                  pressed: { outline: "none" },
                }}
              />
            );
          })
        }
      </Geographies>

      {/* Connection arcs between nearby chapters */}
      {CONNECTIONS.map(([i, j]) => {
        const a = CHAPTERS[i]!;
        const b = CHAPTERS[j]!;
        const isHighlighted =
          hoveredIndex !== null && (i === hoveredIndex || j === hoveredIndex);
        return (
          <Line
            key={`${i}-${j}`}
            from={[a.lng, a.lat]}
            to={[b.lng, b.lat]}
            stroke={
              isHighlighted
                ? "oklch(var(--primary) / 0.5)"
                : "oklch(var(--primary) / 0.1)"
            }
            strokeWidth={isHighlighted ? 1.5 : 0.6}
            strokeLinecap="round"
            strokeDasharray={isHighlighted ? undefined : "4 6"}
          />
        );
      })}

      {/* Chapter markers */}
      {CHAPTERS.map((chapter, i) => {
        const isHovered = hoveredIndex === i;
        return (
          <Marker
            key={chapter.countryKey}
            coordinates={[chapter.lng, chapter.lat]}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: "pointer" }}
          >
            {/* Animated pulse ring */}
            <circle r={12} fill="none" stroke="oklch(var(--primary) / 0.3)" strokeWidth={1}>
              <animate attributeName="r" from="5" to="16" dur="2.5s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.7" to="0" dur="2.5s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
            </circle>
            {/* Outer glow */}
            <circle
              r={isHovered ? 9 : 6}
              fill="oklch(var(--primary) / 0.2)"
              style={{ transition: "r 0.2s" }}
            />
            {/* Main dot */}
            <circle
              r={isHovered ? 5 : 3.5}
              fill="oklch(var(--primary))"
              stroke="oklch(var(--card))"
              strokeWidth={1.5}
              style={{ transition: "r 0.2s" }}
            />
            {/* Specular highlight */}
            <circle r={1} cx={-0.8} cy={-0.8} fill="white" opacity={0.5} />

            {/* Tooltip */}
            {isHovered && (
              <g>
                <rect
                  x={-52}
                  y={-42}
                  width={104}
                  height={30}
                  rx={6}
                  fill="oklch(var(--popover))"
                  stroke="oklch(var(--border))"
                  strokeWidth={0.5}
                  style={{ filter: "drop-shadow(0 2px 4px oklch(0 0 0 / 0.15))" }}
                />
                {/* Arrow */}
                <polygon
                  points="-5,-12 5,-12 0,-6"
                  fill="oklch(var(--popover))"
                  stroke="oklch(var(--border))"
                  strokeWidth={0.5}
                />
                <rect x={-52} y={-42} width={104} height={2} rx={0} fill="oklch(var(--popover))" />
                <text
                  textAnchor="middle"
                  y={-28}
                  fill="oklch(var(--popover-foreground))"
                  fontSize={8}
                  fontWeight={600}
                  fontFamily="system-ui, sans-serif"
                >
                  {getCountryLabel(chapter.countryKey)}
                </text>
                <text
                  textAnchor="middle"
                  y={-18}
                  fill="oklch(var(--muted-foreground))"
                  fontSize={6.5}
                  fontFamily="system-ui, sans-serif"
                >
                  {chapter.coaches} {t("coachesCount")}
                </text>
              </g>
            )}
          </Marker>
        );
      })}
    </ComposableMap>
  );
});

export function DotMap() {
  const [mounted, setMounted] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const t = useTranslations("dashboard");
  const getCountryLabel = (key: (typeof CHAPTERS)[number]["countryKey"]) =>
    t(`countries.${key}`);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted)
    return <div className="h-80 bg-muted/20 rounded-xl animate-pulse" />;

  return (
    <div className="relative w-full rounded-xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t("globalNetwork")}
          </h3>
          <p className="text-xs text-muted-foreground">
            {CHAPTERS.length} {t("activeChapters")}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            {t("active")}
          </span>
        </div>
      </div>

      {/* Map */}
      <div className="relative w-full aspect-[2/1] min-h-[280px]">
        <WorldMap
          hoveredIndex={hoveredIndex}
          onHover={setHoveredIndex}
          getCountryLabel={getCountryLabel}
          t={t}
        />
      </div>

      {/* Chapter chips legend */}
      <div className="px-5 py-3 border-t flex gap-2 overflow-x-auto">
        {CHAPTERS.map((chapter, i) => (
          <Badge
            key={chapter.countryKey}
            variant="outline"
            className={`shrink-0 gap-1.5 text-xs cursor-pointer transition-colors duration-200 ${
              hoveredIndex === i ? "border-primary bg-primary/10" : ""
            }`}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            {getCountryLabel(chapter.countryKey)}
          </Badge>
        ))}
      </div>
    </div>
  );
}
