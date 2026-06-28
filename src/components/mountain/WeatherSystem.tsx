"use client";

import { useMemo, useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface WeatherSystemProps {
  progress: number;
  season: string;
}

function Particles({ count, spread, speed, color, size, progress }: {
  count: number;
  spread: number;
  speed: number;
  color: string;
  size: number;
  progress: number;
}) {
  const mesh = useRef<THREE.Points>(null);
  const geoRef = useRef<THREE.BufferGeometry>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread;
      pos[i * 3 + 1] = Math.random() * spread * 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
    }
    return pos;
  }, [count, spread]);

  useEffect(() => {
    if (geoRef.current) {
      geoRef.current.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    }
  }, [positions]);

  useFrame((_state, delta) => {
    if (mesh.current) {
      const attr = mesh.current.geometry.getAttribute("position");
      const pos = attr.array as Float32Array;
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] -= delta * speed * (0.5 + progress);
        if (pos[i * 3 + 1] < -5) {
          pos[i * 3 + 1] = spread * 2;
          pos[i * 3] = (Math.random() - 0.5) * spread;
          pos[i * 3 + 2] = (Math.random() - 0.5) * spread;
        }
      }
      attr.needsUpdate = true;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry ref={geoRef} />
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function CloudCluster({ position, scale = 1, opacity }: { position: [number, number, number]; scale?: number; opacity: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 0.2 + offset) * 0.002;
    }
  });

  const spheres = useMemo(() => {
    const count = 3 + Math.floor(Math.random() * 3);
    const items: { offset: [number, number, number]; radius: number }[] = [];
    for (let i = 0; i < count; i++) {
      items.push({
        offset: [
          (Math.random() - 0.5) * 2.5,
          (Math.random() - 0.5) * 0.8,
          (Math.random() - 0.5) * 1.5,
        ],
        radius: 1 + Math.random() * 1.2,
      });
    }
    return items;
  }, []);

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {spheres.map((s, i) => (
        <mesh key={i} position={s.offset}>
          <sphereGeometry args={[s.radius, 12, 8]} />
          <meshToonMaterial color="white" transparent opacity={opacity} />
        </mesh>
      ))}
    </group>
  );
}

export function WeatherSystem({ progress, season }: WeatherSystemProps) {
  const rainIntensity = season === "winter" ? 0 :
    season === "autumn" ? 0.4 :
    progress > 0.5 ? 0.3 : 0.1;

  const snowIntensity = season === "winter" ? 1 : progress > 0.7 ? 0.5 : 0;

  const clouds = useMemo(() => {
    const items: { position: [number, number, number]; scale: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 15;
      items.push({
        position: [
          Math.cos(angle) * radius,
          8 + Math.random() * 5,
          Math.sin(angle) * radius,
        ],
        scale: 1 + Math.random() * 2,
      });
    }
    return items;
  }, []);

  return (
    <group>
      {clouds.map((c, i) => (
        <CloudCluster
          key={`cloud-${i}`}
          position={c.position}
          scale={c.scale}
          opacity={0.3 + progress * 0.2}
        />
      ))}
      {rainIntensity > 0.1 && (
        <Particles
          count={Math.floor(200 * rainIntensity)}
          spread={30}
          speed={8}
          color="#87ceeb"
          size={0.05}
          progress={progress}
        />
      )}
      {snowIntensity > 0.1 && (
        <Particles
          count={Math.floor(300 * snowIntensity)}
          spread={30}
          speed={3}
          color="white"
          size={0.1}
          progress={progress}
        />
      )}
    </group>
  );
}
