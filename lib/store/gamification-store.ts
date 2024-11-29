import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { UserAchievement, BADGES, Badge } from '@/lib/types/Gamification';

interface GamificationState {
  achievements: UserAchievement;
  newBadges: Badge[];
  addContribution: () => void;
  checkStreak: () => void;
  clearNewBadges: () => void;
  getPointsDisplay: () => string;
  getStreakDisplay: () => string;
  calculateLevel: () => number;
}

const POINTS_PER_CONTRIBUTION = 10;
const STREAK_BONUS = 5;
const INITIAL_STATE: UserAchievement = {
  userId: 'default',
  points: 0,
  streak: {
    current: 0,
    longest: 0,
    lastContribution: new Date(0).toISOString(),
  },
  contributions: 0,
  badges: [],
};

const checkForNewBadges = (achievements: UserAchievement): Badge[] => {
  const newBadges: Badge[] = [];
  
  BADGES.forEach(badge => {
    if (achievements.badges.includes(badge.id)) return;

    let qualified = false;
    switch (badge.requirement.type) {
      case 'points':
        qualified = achievements.points >= badge.requirement.threshold;
        break;
      case 'streak':
        qualified = achievements.streak.current >= badge.requirement.threshold;
        break;
      case 'contributions':
        qualified = achievements.contributions >= badge.requirement.threshold;
        break;
    }

    if (qualified) {
      newBadges.push(badge);
    }
  });

  return newBadges;
};

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      achievements: INITIAL_STATE,
      newBadges: [],

      addContribution: () => {
        set(state => {
          const now = new Date();
          const lastContribution = new Date(state.achievements.streak.lastContribution);
          const daysSinceLastContribution = Math.floor(
            (now.getTime() - lastContribution.getTime()) / (1000 * 60 * 60 * 24)
          );

          // Calculate points including streak bonus
          const streakBonus = state.achievements.streak.current * STREAK_BONUS;
          const pointsEarned = POINTS_PER_CONTRIBUTION + streakBonus;

          const newAchievements: UserAchievement = {
            ...state.achievements,
            points: state.achievements.points + pointsEarned,
            contributions: state.achievements.contributions + 1,
            streak: {
              ...state.achievements.streak,
              lastContribution: now.toISOString(),
            },
          };

          // Check for new badges
          const newBadges = checkForNewBadges(newAchievements);
          if (newBadges.length > 0) {
            newAchievements.badges = [
              ...newAchievements.badges,
              ...newBadges.map(b => b.id)
            ];
          }

          return {
            achievements: newAchievements,
            newBadges,
          };
        });
      },

      checkStreak: () => {
        set(state => {
          const now = new Date();
          const lastContribution = new Date(state.achievements.streak.lastContribution);
          const daysSinceLastContribution = Math.floor(
            (now.getTime() - lastContribution.getTime()) / (1000 * 60 * 60 * 24)
          );

          let newStreak = state.achievements.streak.current;

          if (daysSinceLastContribution === 1) {
            // Maintain streak
            newStreak += 1;
          } else if (daysSinceLastContribution > 1) {
            // Break streak
            newStreak = 0;
          }

          const newAchievements: UserAchievement = {
            ...state.achievements,
            streak: {
              current: newStreak,
              longest: Math.max(newStreak, state.achievements.streak.longest),
              lastContribution: state.achievements.streak.lastContribution,
            },
          };

          // Check for new badges
          const newBadges = checkForNewBadges(newAchievements);
          if (newBadges.length > 0) {
            newAchievements.badges = [
              ...newAchievements.badges,
              ...newBadges.map(b => b.id)
            ];
          }

          return {
            achievements: newAchievements,
            newBadges,
          };
        });
      },

      clearNewBadges: () => {
        set({ newBadges: [] });
      },

      getPointsDisplay: () => {
        const { points } = get().achievements;
        if (points >= 1000) {
          return `${(points / 1000).toFixed(1)}K`;
        }
        return points.toString();
      },

      getStreakDisplay: () => {
        const { current, longest } = get().achievements.streak;
        return `${current}🔥 (Best: ${longest})`;
      },

      calculateLevel: () => {
        const { points } = get().achievements;
        return Math.floor(Math.sqrt(points / 100)) + 1;
      },
    }),
    {
      name: 'coverage-gamification',
    }
  )
);
