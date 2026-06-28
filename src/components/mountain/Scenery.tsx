"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { fbm } from "@/lib/utils/noise";

interface SceneryProps {
  progress: number;
  season: string;
}

function getHeight(x: number, z: number): number {
  const size = 50;
  const maxDist = size * 0.7;
  const distFromCenter = Math.sqrt(x * x + z * z);
  const falloff = Math.max(0, 1 - distFromCenter / maxDist);
  const n = fbm(x * 0.08, z * 0.08, 5);
  return n * falloff * 9 + Math.pow(falloff, 2) * 21;
}

function PineTree({ position, scale = 1, rotationY = 0, color }: { position: [number, number, number]; scale?: number; rotationY?: number; color: string }) {
  const trunkRef = useRef<THREE.Mesh>(null);
  const foliageRef = useRef<THREE.Mesh>(null);

  return (
    <group position={position} scale={scale} rotation={[0, rotationY, 0]}>
      <mesh ref={trunkRef} position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 0.4, 4]} />
        <meshToonMaterial color="#8B5E3C" />
      </mesh>
      <mesh ref={foliageRef} position={[0, 1, 0]}>
        <coneGeometry args={[0.3, 0.6, 5]} />
        <meshToonMaterial color={color} />
      </mesh>
    </group>
  );
}

function RoundTree({ position, scale = 1, rotationY = 0, color }: { position: [number, number, number]; scale?: number; rotationY?: number; color: string }) {
  return (
    <group position={position} scale={scale} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 0.5, 4]} />
        <meshToonMaterial color="#8B5E3C" />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.25, 6, 6]} />
        <meshToonMaterial color={color} />
      </mesh>
    </group>
  );
}

function Rock({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <mesh position={position} scale={scale}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshToonMaterial color="#b8a89a" />
    </mesh>
  );
}

export function Scenery({ progress, season }: SceneryProps) {
  const treeColor = season === "winter" ? "#5a7a5a" :
    season === "autumn" ? "#e07a3a" : "#4a9a5a";

  const roundTreeColor = season === "winter" ? "#6a8a6a" :
    season === "autumn" ? "#e89a4a" : "#5aaa6a";

  const treeCount = Math.floor(160 * (1 - progress * 0.6));

  const trees = useMemo(() => {
    const items: { position: [number, number, number]; scale: number; rotationY: number; variant: "pine" | "round" }[] = [];
    for (let i = 0; i < treeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 4 + Math.random() * 16;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = getHeight(x, z);
      if (y > -1 && y < 6) {
        items.push({
          position: [x, y, z],
          scale: 0.3 + Math.random() * 1.2,
          rotationY: Math.random() * Math.PI * 2,
          variant: Math.random() > 0.5 ? "pine" : "round",
        });
      }
    }
    return items;
  }, [treeCount]);

  const rocks = useMemo(() => {
    const items: { position: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 20;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = getHeight(x, z);
      if (y > 2) {
        items.push({ position: [x, y, z], scale: 0.5 + Math.random() * 1.5 });
      }
    }
    return items;
  }, []);

  const flowers = useMemo(() => {
    if (season === "winter") return [];
    const items: { position: [number, number, number]; color: string }[] = [];
    const colors = ["#e76f51", "#f4a261", "#e9c46a", "#2a9d8f"];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 14;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = getHeight(x, z);
      if (y > -1 && y < 3) {
        items.push({ position: [x, y, z], color: colors[Math.floor(Math.random() * colors.length)] });
      }
    }
    return items;
  }, [season]);

  return (
    <group>
      {trees.map((t, i) => (
        t.variant === "pine"
          ? <PineTree key={`tree-${i}`} position={t.position} scale={t.scale} rotationY={t.rotationY} color={treeColor} />
          : <RoundTree key={`tree-${i}`} position={t.position} scale={t.scale} rotationY={t.rotationY} color={roundTreeColor} />
      ))}
      {rocks.map((r, i) => (
        <Rock key={`rock-${i}`} position={r.position} scale={r.scale} />
      ))}
      {flowers.map((f, i) => (
        <mesh key={`flower-${i}`} position={[f.position[0], f.position[1], f.position[2]]}>
          <sphereGeometry args={[0.04, 4, 4]} />
          <meshToonMaterial color={f.color} />
        </mesh>
      ))}
    </group>
  );
}
