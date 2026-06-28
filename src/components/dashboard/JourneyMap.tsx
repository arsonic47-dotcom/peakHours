"use client";

import { useMemo } from "react";

interface JourneyMapProps {
  progress: number;
  hours: number;
  targetHours: number;
}

const REGIONS = [
  { name: "Base Camp", x: 170, y: 440 },
  { name: "Low Forest", x: 280, y: 370 },
  { name: "Mid Ridge", x: 110, y: 300 },
  { name: "Snow Line", x: 290, y: 230 },
  { name: "High Pass", x: 100, y: 160 },
  { name: "Summit Zone", x: 300, y: 90 },
  { name: "Peak", x: 200, y: 30 },
];

function getStarPoints(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: string[] = [];
  for (let i = 0; i < 5; i++) {
    const outerAngle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const innerAngle = outerAngle + Math.PI / 5;
    points.push(`${cx + outerR * Math.cos(outerAngle)},${cy + outerR * Math.sin(outerAngle)}`);
    points.push(`${cx + innerR * Math.cos(innerAngle)},${cy + innerR * Math.sin(innerAngle)}`);
  }
  return points.join(" ");
}

export function JourneyMap({ progress, hours, targetHours }: JourneyMapProps) {
  const clampedProgress = Math.min(progress, 1);
  const pct = Math.min(clampedProgress * 100, 100);

  const segments = useMemo(() => {
    return REGIONS.slice(0, -1).map((start, i) => {
      const end = REGIONS[i + 1];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const regionP = clampedProgress * 7 - i;
      const fill = Math.min(Math.max(regionP, 0), 1);
      return {
        x1: start.x, y1: start.y,
        x2: end.x, y2: end.y,
        length,
        fillFraction: fill,
        status: regionP >= 1 ? "completed" : regionP <= 0 ? "locked" : "active",
      };
    });
  }, [clampedProgress]);

  const nodeStatuses = useMemo(() => {
    return REGIONS.map((_, i) => {
      const regionP = clampedProgress * 7 - i;
      if (regionP >= 1) return "completed";
      if (regionP <= 0) return "locked";
      return "active";
    });
  }, [clampedProgress]);

  return (
    <div className="flex flex-col items-center w-full">
      <svg viewBox="0 0 400 480" className="w-full h-auto" style={{ maxHeight: "460px" }}>
        <polygon
          points="60,470 200,30 340,470"
          fill="var(--color-surface-secondary)"
          opacity="0.4"
        />
        <polygon
          points="120,470 200,100 280,470"
          fill="var(--color-surface-tertiary)"
          opacity="0.25"
        />

        {segments.map((seg, i) => (
          <line
            key={`bg-${i}`}
            x1={seg.x1} y1={seg.y1}
            x2={seg.x2} y2={seg.y2}
            stroke="var(--color-border)"
            strokeWidth={10}
            strokeLinecap="round"
          />
        ))}

        {segments.map((seg, i) => (
          <line
            key={`fill-${i}`}
            x1={seg.x1} y1={seg.y1}
            x2={seg.x2} y2={seg.y2}
            stroke={seg.status === "locked" ? "transparent" : "var(--color-primary-500)"}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={seg.length}
            strokeDashoffset={seg.length * (1 - seg.fillFraction)}
            style={{ transition: "stroke-dashoffset 0.7s ease-out" }}
          />
        ))}

        {REGIONS.map((region, i) => {
          const status = nodeStatuses[i];
          const isPeak = i === 6;

          if (isPeak) {
            return (
              <g key={region.name}>
                <polygon
                  points={getStarPoints(region.x, region.y, 11, 5)}
                  fill={status === "locked" ? "var(--color-border)" : "var(--color-primary-500)"}
                  style={status === "active" ? { animation: "pulse 2s ease-in-out infinite" } : undefined}
                />
                <text
                  x={region.x}
                  y={region.y - 20}
                  textAnchor="middle"
                  fill="var(--color-text-primary)"
                  fontSize="11"
                  fontWeight="600"
                >
                  {region.name}
                </text>
              </g>
            );
          }

          const labelX = region.x < 200 ? region.x - 16 : region.x + 16;
          const labelAnchor = region.x < 200 ? "end" : "start";

          return (
            <g key={region.name}>
              <circle
                cx={region.x}
                cy={region.y}
                r={11}
                fill={status === "locked" ? "var(--color-surface-tertiary)" : "var(--color-surface)"}
                stroke={status === "locked" ? "var(--color-border)" : "var(--color-primary-500)"}
                strokeWidth={3}
                style={status === "active" ? { animation: "pulse 2s ease-in-out infinite" } : undefined}
              />
              {status === "completed" && (
                <circle cx={region.x} cy={region.y} r={6} fill="var(--color-primary-500)" />
              )}
              <text
                x={labelX}
                y={region.y + 4}
                textAnchor={labelAnchor}
                fill="var(--color-text-primary)"
                fontSize="11"
                fontWeight="500"
              >
                {region.name}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex items-center gap-2 mt-2 text-sm">
        <span className="text-text-secondary">Progress:</span>
        <span className="font-semibold text-text-primary">{pct.toFixed(1)}%</span>
        <span className="text-text-tertiary">({hours.toFixed(1)} / {targetHours} hrs)</span>
      </div>
    </div>
  );
}
