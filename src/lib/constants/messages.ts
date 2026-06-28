export const ENCOURAGING_MESSAGES = [
  "One more hour. One step closer to the summit.",
  "You've already come so far.",
  "Small steps lead to great heights.",
  "Discipline is choosing between what you want now and what you want most.",
  "Every session counts. Every hour matters.",
  "You are building something extraordinary.",
  "The mountain doesn't care how fast you climb. Just that you keep climbing.",
  "Progress, not perfection.",
  "You didn't come this far to only come this far.",
  "Your future self is thanking you right now.",
];

export const TIMER_COMPLETE_MESSAGES = [
  "Session complete! You're one step closer.",
  "Excellent focus! Every hour brings you higher.",
  "Well done! That's another brick in the mountain.",
  "Session finished. Take a breath, then keep going.",
  "You did it! Consistency is your superpower.",
];

export const DAILY_GOAL_MESSAGES = [
  "You crushed your daily goal!",
  "Another day conquered!",
  "Your daily discipline is inspiring.",
  "Day complete. Mountain, here you come.",
];

export const MILESTONE_MESSAGES: Record<string, string> = {
  "100": "Your first major milestone. The journey is real now.",
  "500": "Halfway to your first thousand. You're building momentum.",
  "1000": "You are no longer chasing motivation. You are driven by discipline.",
  "2500": "You conquered the mountain.",
};

export function getMilestoneMessage(hours: number): string {
  if (MILESTONE_MESSAGES[hours.toString()]) return MILESTONE_MESSAGES[hours.toString()];
  return `You've reached ${hours} hours of focused work.`;
}
