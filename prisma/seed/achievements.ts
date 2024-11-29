import { PrismaClient } from '@prisma/client';
import { AchievementCreateInput } from '../types';

const achievementTemplates: Omit<AchievementCreateInput, 'userId'>[] = [
  {
    title: "First Steps",
    description: "Make your first WiFi spot measurement",
    points: 100,
    type: "wifi_spots",
    threshold: 1,
    icon: "🎯",
    unlockedAt: null
  },
  {
    title: "Rural Explorer",
    description: "Take measurements in rural areas",
    points: 250,
    type: "coverage_reports",
    threshold: 10,
    icon: "🌾",
    unlockedAt: null
  },
  {
    title: "Coverage Champion",
    description: "Become a top contributor with verified measurements",
    points: 1000,
    type: "coverage_reports",
    threshold: 50,
    icon: "👑",
    unlockedAt: null
  },
  {
    title: "Streak Master",
    description: "Maintain a daily streak of measurements",
    points: 500,
    type: "streak",
    threshold: 7,
    icon: "🔥",
    unlockedAt: null
  }
];

export async function seedAchievements(prisma: PrismaClient) {
  console.log('Seeding achievements...');

  // Get all users
  const users = await prisma.user.findMany();

  // Create achievements for each user
  for (const user of users) {
    for (const template of achievementTemplates) {
      const achievement: AchievementCreateInput = {
        ...template,
        userId: user.id
      };
      
      await prisma.achievement.create({
        data: achievement
      });
    }
  }

  console.log('Achievement seeding completed');
}
