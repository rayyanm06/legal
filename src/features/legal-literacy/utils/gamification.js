// gamification.js - Gamification utility functions
// Calculates level and badges for optimistic UI updates

export const getLevel = (points) => {
  if (points <= 50) return "Beginner";
  if (points <= 150) return "Aware";
  return "Advanced";
};

export const getBadges = (completedCount, correctCount, totalScenarios = 4) => {
  const earnedBadges = [];
  
  if (completedCount >= 1) {
    earnedBadges.push("First Step");
  }
  
  if (correctCount >= 5) {
    earnedBadges.push("Sharp Mind");
  }
  
  if (completedCount >= totalScenarios) {
    earnedBadges.push("Legal Eagle");
  }
  
  return earnedBadges;
};
