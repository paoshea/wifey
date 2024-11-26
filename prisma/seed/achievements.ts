import { PrismaClient } from '@prisma/client';
import { AchievementRarity } from '../../lib/gamification/types';

const achievements = [
  {
    title: "First Steps",
    description: "Make your first measurement",
    points: 100,
    icon: '🎯',
    rarity: 'common' as AchievementRarity,
    requirements: [
      {
        type: 'measurements',
        value: 1,
        operator: 'gte',
        metric: 'total_measurements',
        description: 'Make at least 1 measurement'
      }
    ],
    target: 1
  },
  {
    title: "Rural Explorer",
    description: "Take measurements in rural areas",
    points: 250,
    icon: '🌾',
    rarity: 'rare' as AchievementRarity,
    requirements: [
      {
        type: 'rural_measurements',
        value: 10,
        operator: 'gte',
        metric: 'rural_measurements',
        description: 'Make at least 10 measurements in rural areas'
      }
    ],
    target: 10
  },
  {
    title: "Coverage Champion",
    description: "Become a top contributor with verified measurements",
    points: 1000,
    icon: '👑',
    rarity: 'epic' as AchievementRarity,
    requirements: [
      {
        type: 'verified_spots',
        value: 50,
        operator: 'gte',
        metric: 'verified_spots',
        description: 'Get 50 measurements verified by other users'
      },
      {
        type: 'accuracy',
        value: 95,
        operator: 'gte',
        metric: 'accuracy_rate',
        description: 'Maintain 95% accuracy rate'
      }
    ],
    target: 50
  }
];

export async function seedAchievements(prisma: PrismaClient) {
  console.log('Seeding achievements...');
  
  for (const achievement of achievements) {
    await prisma.achievement.create({
      data: achievement
    });
  }
  
  console.log('Achievement seeding completed');
}
