"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface CharacterProps {
  position: [number, number, number];
  progress: number;
  rotationY: number;
}

export function Character({ position, progress, rotationY }: CharacterProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1];
      const bob = Math.sin(state.clock.elapsedTime * (1 + progress * 2)) * 0.1;
      groupRef.current.position.y += bob;
    }
  });

  const headColor = progress < 0.25 ? "#e76f51" :
    progress < 0.5 ? "#f4a261" :
    progress < 0.75 ? "#e9c46a" : "#2a9d8f";

  const bodyColor = progress < 0.25 ? "#264653" :
    progress < 0.5 ? "#2a9d8f" :
    progress < 0.75 ? "#e76f51" : "#f4a261";

  return (
    <group ref={groupRef} position={[position[0], position[1], position[2]]} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshToonMaterial color={headColor} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.6, 6]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.35, 0.4, 6]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
      {progress >= 0.1 && (
        <pointLight position={[0, 1.2, 0]} intensity={0.5} color={headColor} distance={3} />
      )}
    </group>
  );
}
