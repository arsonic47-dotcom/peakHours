import type { Level } from "@/types";

export const LEVELS: Level[] = [
  { level: 1, title: "Beginner", xp_needed: 0, cumulative_hours: 0 },
  { level: 5, title: "Explorer", xp_needed: 11180, cumulative_hours: 112 },
  { level: 10, title: "Disciplined", xp_needed: 31623, cumulative_hours: 316 },
  { level: 20, title: "Warrior", xp_needed: 89443, cumulative_hours: 894 },
  { level: 35, title: "Scholar", xp_needed: 207063, cumulative_hours: 2071 },
  { level: 50, title: "Master", xp_needed: 353553, cumulative_hours: 3536 },
  { level: 75, title: "Legend", xp_needed: 649519, cumulative_hours: 6495 },
  { level: 100, title: "Peak Conqueror", xp_needed: 1000000, cumulative_hours: 10000 },
];

export const XP_PER_HOUR = 100;

export function getLevel(xp: number): Level {
  let currentLevel = LEVELS[0];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp_needed) {
      currentLevel = LEVELS[i];
      break;
    }
  }
  return currentLevel;
}

export function getLevelFromHours(hours: number): number {
  return Math.floor(Math.sqrt(hours / 5)) + 1;
}

export function getLevelTitle(level: number): string {
  const found = LEVELS.find((l) => l.level <= level);
  if (found) return found.title;
  if (level >= 100) return "Peak Conqueror";
  if (level >= 75) return "Legend";
  if (level >= 50) return "Master";
  if (level >= 35) return "Scholar";
  if (level >= 20) return "Warrior";
  if (level >= 10) return "Disciplined";
  if (level >= 5) return "Explorer";
  return "Beginner";
}

export function getXPForLevel(level: number): number {
  return Math.floor(1000 * Math.pow(level, 1.5));
}

export function getNextLevelXP(currentXP: number): { current: number; next: number; progress: number } {
  const currentLevel = getLevelFromHours(currentXP / XP_PER_HOUR);
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  const progress = ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
  return { current: currentXP - currentLevelXP, next: nextLevelXP - currentLevelXP, progress: Math.min(progress, 100) };
}
