import { PrismaClient } from '@prisma/client';
import { AchievementInput } from '../types';

const achievements: AchievementInput[] = [
  {
    category: 'CONTRIBUTION',
    title: "First Steps",
    description: "Make your first measurement",
    points: 100,
    icon: '🎯',
    tier: 'BRONZE',
    requirements: {
      type: 'MEASUREMENT_COUNT',
      threshold: 1
    },
    isSecret: false
  },
  {
    category: 'CONTRIBUTION',
    title: "Rural Explorer",
    description: "Take measurements in rural areas",
    points: 250,
    icon: '🌾',
    tier: 'SILVER',
    requirements: {
      type: 'RURAL_MEASUREMENTS',
      threshold: 10
    },
    isSecret: false
  },
  {
    category: 'VERIFICATION',
    title: "Verification Master",
    description: "Verify other users' measurements",
    points: 500,
    icon: '🛡️',
    tier: 'GOLD',
    requirements: {
      type: 'VERIFICATIONS',
      threshold: 50
    },
    isSecret: false
  },
  {
    category: 'QUALITY',
    title: "Accuracy Champion",
    description: "Maintain high measurement accuracy",
    points: 1000,
    icon: '🎯',
    tier: 'PLATINUM',
    requirements: {
      type: 'ACCURACY_RATE',
      threshold: 95
    },
    isSecret: false
  },
  {
    category: 'STREAK',
    title: "Consistent Contributor",
    description: "Contribute measurements for consecutive days",
    points: 750,
    icon: '🔥',
    tier: 'GOLD',
    requirements: {
      type: 'CONSECUTIVE_DAYS',
      threshold: 7
    },
    isSecret: false
  },
  {
    category: 'SECRET',
    title: "Night Owl",
    description: "Take measurements during night hours",
    points: 300,
    icon: '🦉',
    tier: 'SILVER',
    requirements: {
      type: 'TIME_BASED',
      startHour: 22,
      endHour: 5
    },
    isSecret: true
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
