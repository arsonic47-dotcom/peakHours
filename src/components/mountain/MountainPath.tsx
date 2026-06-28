"use client";

import { useMemo } from "react";
import { Line } from "@react-three/drei";
import { getPathPosition } from "@/lib/utils/path";

interface MountainPathProps {
  progress: number;
  terrainHeight: number;
}

export function MountainPath({ progress, terrainHeight }: MountainPathProps) {
  const { pathPoints, activePoints } = useMemo(() => {
    const points: [number, number, number][] = [];
    const numPoints = 50;

    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const p = getPathPosition(t, terrainHeight);
      points.push([p.x, p.y, p.z]);
    }

    const activeIndex = Math.min(Math.floor(progress * numPoints), numPoints);
    return { pathPoints: points, activePoints: points.slice(0, activeIndex + 1) };
  }, [terrainHeight, progress]);

  return (
    <group>
      <Line points={pathPoints} color="#8b7355" lineWidth={1} transparent opacity={0.3} />
      <Line points={activePoints} color="#d4a853" lineWidth={2} />
    </group>
  );
}
