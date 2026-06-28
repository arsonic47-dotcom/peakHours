export interface Cosmetic {
  id: string;
  name: string;
  category: "hat" | "backpack" | "jacket" | "walking_stick" | "glasses" | "flag" | "glow" | "trail";
  unlockLevel: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  description: string;
}

export const COSMETICS: Cosmetic[] = [
  { id: "hat_basic", name: "Basic Cap", category: "hat", unlockLevel: 2, rarity: "common", description: "A simple cap for your journey." },
  { id: "hat_beanie", name: "Warm Beanie", category: "hat", unlockLevel: 10, rarity: "rare", description: "Keeps you warm in the snow." },
  { id: "hat_headband", name: "Headband", category: "hat", unlockLevel: 5, rarity: "common", description: "For the focused warrior." },
  { id: "backpack_basic", name: "Starter Pack", category: "backpack", unlockLevel: 1, rarity: "common", description: "Every climber needs a pack." },
  { id: "backpack_leather", name: "Leather Satchel", category: "backpack", unlockLevel: 15, rarity: "rare", description: "Vintage and reliable." },
  { id: "backpack_hiking", name: "Hiking Pack", category: "backpack", unlockLevel: 25, rarity: "epic", description: "Built for the long haul." },
  { id: "jacket_light", name: "Light Jacket", category: "jacket", unlockLevel: 8, rarity: "common", description: "For mild weather climbs." },
  { id: "jacket_insulated", name: "Insulated Parka", category: "jacket", unlockLevel: 30, rarity: "rare", description: "Braving the frozen slopes." },
  { id: "jacket_windbreaker", name: "Windbreaker", category: "jacket", unlockLevel: 20, rarity: "rare", description: "Cutting through the storm." },
  { id: "stick_basic", name: "Walking Stick", category: "walking_stick", unlockLevel: 3, rarity: "common", description: "A trusted companion." },
  { id: "stick_crystal", name: "Crystal Staff", category: "walking_stick", unlockLevel: 50, rarity: "legendary", description: "Glows with inner power." },
  { id: "glasses_sunglasses", name: "Sunglasses", category: "glasses", unlockLevel: 12, rarity: "common", description: "Cool and practical." },
  { id: "glasses_goggles", name: "Snow Goggles", category: "glasses", unlockLevel: 35, rarity: "epic", description: "Vision through the storm." },
  { id: "flag_peak", name: "Peak Flag", category: "flag", unlockLevel: 75, rarity: "legendary", description: "Plant it at the summit." },
  { id: "flag_small", name: "Pennant", category: "flag", unlockLevel: 40, rarity: "rare", description: "Small but mighty." },
  { id: "glow_basic", name: "Soft Aura", category: "glow", unlockLevel: 25, rarity: "epic", description: "A gentle inner light." },
  { id: "glow_golden", name: "Golden Halo", category: "glow", unlockLevel: 60, rarity: "legendary", description: "The glow of mastery." },
  { id: "trail_sparkle", name: "Sparkle Trail", category: "trail", unlockLevel: 45, rarity: "epic", description: "Leave a trail of light." },
  { id: "trail_fire", name: "Fire Trail", category: "trail", unlockLevel: 80, rarity: "legendary", description: "Burning with determination." },
];
