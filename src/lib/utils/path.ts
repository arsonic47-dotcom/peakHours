import { fbm } from "./noise";

function getHeight(x: number, z: number, height: number): number {
  const size = 50;
  const distFromCenter = Math.sqrt(x * x + z * z);
  const maxDist = size * 0.7;
  const falloff = Math.max(0, 1 - distFromCenter / maxDist);
  const n = fbm(x * 0.08, z * 0.08, 5);
  return n * falloff * height * 0.3 + Math.pow(falloff, 2) * height * 0.7;
}

export function getPathPosition(t: number, terrainHeight: number): { x: number; y: number; z: number } {
  const angle = t * Math.PI * 1.5;
  const radius = 8 + t * 12;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = getHeight(x, z, terrainHeight);
  return { x, y, z };
}

export function getPathDirection(t: number, terrainHeight: number): { dx: number; dy: number; dz: number } {
  const dt = 0.01;
  const p1 = getPathPosition(t - dt, terrainHeight);
  const p2 = getPathPosition(t + dt, terrainHeight);
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
  return { dx: dx / len, dy: dy / len, dz: dz / len };
}
