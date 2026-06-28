"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { MountainTerrain } from "./MountainTerrain";
import { MountainPath } from "./MountainPath";
import { Character } from "./Character";
import { Scenery } from "./Scenery";
import { WeatherSystem } from "./WeatherSystem";
import { FollowCamera } from "./FollowCamera";
import { getPathPosition, getPathDirection } from "@/lib/utils/path";
import * as THREE from "three";

interface MountainSceneProps {
  progress: number;
  hours: number;
  targetHours: number;
}

export function MountainScene({ progress, hours, targetHours }: MountainSceneProps) {
  const progressClamped = Math.min(progress, 1);
  const terrainHeight = 30;

  const season = progressClamped < 0.3 ? "spring" :
    progressClamped < 0.5 ? "summer" :
    progressClamped < 0.7 ? "autumn" : "winter";

  const sunElevation = 20 + progressClamped * 40;

  const pathPos = useMemo(
    () => getPathPosition(progressClamped, terrainHeight),
    [progressClamped, terrainHeight]
  );

  const direction = useMemo(
    () => getPathDirection(progressClamped, terrainHeight),
    [progressClamped, terrainHeight]
  );

  const rotationY = useMemo(
    () => Math.atan2(direction.dx, direction.dz),
    [direction]
  );

  const cameraTarget = useMemo(
    () => new THREE.Vector3(pathPos.x, pathPos.y + 1, pathPos.z),
    [pathPos]
  );

  const cameraDirection = useMemo(
    () => new THREE.Vector3(direction.dx, direction.dy, direction.dz),
    [direction]
  );

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [25, 15, 25], fov: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <EffectComposer>
            <ambientLight intensity={0.4 + progressClamped * 0.2} />
            <directionalLight
              position={[20, sunElevation, 10]}
              intensity={0.8 + progressClamped * 0.4}
              castShadow
              shadow-mapSize={[1024, 1024]}
            />
            <hemisphereLight
              args={["#87ceeb", "#3a7d44", 0.4]}
            />

            <fog
              attach="fog"
              args={[
                season === "autumn" ? "#c4a882" :
                season === "winter" ? "#b8c4d0" :
                season === "summer" ? "#a0c8e8" :
                "#b0c4de",
                20 + progressClamped * 10,
                45 + progressClamped * 15,
              ]}
            />

            <Sky
              distance={450000}
              sunPosition={[0, sunElevation, 0]}
              inclination={0.3 + progressClamped * 0.3}
              azimuth={0.25}
            />

            <MountainTerrain
              progress={progressClamped}
              season={season}
              height={terrainHeight}
            />

            <MountainPath
              progress={progressClamped}
              terrainHeight={terrainHeight}
            />

            <Character
              position={[pathPos.x, pathPos.y, pathPos.z]}
              progress={progressClamped}
              rotationY={rotationY}
            />

            <Scenery
              progress={progressClamped}
              season={season}
            />

            <WeatherSystem
              progress={progressClamped}
              season={season}
            />

            <Bloom
              luminanceThreshold={0.1}
              luminanceSmoothing={0.9}
              intensity={0.3 + progressClamped * 0.2}
            />
          </EffectComposer>

          <FollowCamera
            target={cameraTarget}
            direction={cameraDirection}
          />
        </Suspense>
      </Canvas>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface/80 backdrop-blur-md rounded-2xl border border-border px-6 py-3 shadow-lg text-center">
        <p className="text-sm font-medium text-text-primary">
          {Math.round(progressClamped * 100)}% of your journey
        </p>
        <p className="text-xs text-text-tertiary">
          {hours.toFixed(1)} / {targetHours} hours
        </p>
      </div>
    </div>
  );
}
