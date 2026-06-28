"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { fbm } from "@/lib/utils/noise";

interface MountainTerrainProps {
  progress: number;
  season: string;
  height: number;
}

function lerpColor(c1: THREE.Color, c2: THREE.Color, t: number): THREE.Color {
  return new THREE.Color().lerpColors(c1, c2, t);
}

export function MountainTerrain({ progress, season, height }: MountainTerrainProps) {
  const { geometry } = useMemo(() => {
    const size = 50;
    const segments = 128;
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const center = size / 2;

    const colors = new Float32Array(pos.count * 3);

    const low = new THREE.Color("#f4a261");
    const mid = new THREE.Color("#2a9d8f");
    const high = new THREE.Color("#e9c46a");
    const peak = new THREE.Color("#f8f9fa");

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const distFromCenter = Math.sqrt(x * x + z * z);
      const maxDist = size * 0.7;
      const falloff = Math.max(0, 1 - distFromCenter / maxDist);

      const n = fbm(x * 0.08, z * 0.08, 5);
      const y = n * falloff * height * 0.3 + Math.pow(falloff, 2) * height * 0.7;
      pos.setY(i, y);

      const normalizedHeight = y / height;
      let color: THREE.Color;
      if (normalizedHeight < 0.2) {
        color = low;
      } else if (normalizedHeight < 0.4) {
        color = lerpColor(low, mid, (normalizedHeight - 0.2) / 0.2);
      } else if (normalizedHeight < 0.6) {
        color = lerpColor(mid, high, (normalizedHeight - 0.4) / 0.2);
      } else if (normalizedHeight < 0.8) {
        color = lerpColor(high, peak, (normalizedHeight - 0.6) / 0.2);
      } else {
        color = peak;
      }

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return { geometry: geo };
  }, [height]);

  return (
    <mesh geometry={geometry} receiveShadow>
      <meshToonMaterial
        vertexColors
      />
    </mesh>
  );
}
