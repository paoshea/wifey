import { PrismaClient } from '@prisma/client';

type AchievementCategory = 'CONTRIBUTION' | 'STREAK' | 'QUALITY' | 'VERIFICATION' | 'SECRET';
type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';

type AchievementRequirement = 
  | { type: 'MEASUREMENT_COUNT' | 'RURAL_MEASUREMENTS' | 'VERIFICATIONS' | 'ACCURACY_RATE'; threshold: number }
  | { type: 'CONSECUTIVE_DAYS'; threshold: number }
  | { type: 'TIME_BASED'; startHour: number; endHour: number };

const achievements = [
  {
    title: "First Steps",
    description: "Make your first measurement",
    category: 'CONTRIBUTION' as AchievementCategory,
    tier: 'BRONZE' as AchievementTier,
    points: 100,
    icon: '🎯',
    requirements: {
      type: 'MEASUREMENT_COUNT',
      threshold: 1
    },
    isSecret: false
  },
  {
    title: "Rural Explorer",
    description: "Take measurements in rural areas",
    category: 'CONTRIBUTION' as AchievementCategory,
    tier: 'SILVER' as AchievementTier,
    points: 250,
    icon: '🌾',
    requirements: {
      type: 'RURAL_MEASUREMENTS',
      threshold: 10
    },
    isSecret: false
  },
  {
    title: "Verification Master",
    description: "Verify other users' measurements",
    category: 'VERIFICATION' as AchievementCategory,
    tier: 'GOLD' as AchievementTier,
    points: 500,
    icon: '🛡️',
    requirements: {
      type: 'VERIFICATIONS',
      threshold: 50
    },
    isSecret: false
  },
  {
    title: "Accuracy Champion",
    description: "Maintain high measurement accuracy",
    category: 'QUALITY' as AchievementCategory,
    tier: 'PLATINUM' as AchievementTier,
    points: 1000,
    icon: '🎯',
    requirements: {
      type: 'ACCURACY_RATE',
      threshold: 95
    },
    isSecret: false
  },
  {
    title: "Consistent Contributor",
    description: "Contribute measurements for consecutive days",
    category: 'STREAK' as AchievementCategory,
    tier: 'GOLD' as AchievementTier,
    points: 750,
    icon: '🔥',
    requirements: {
      type: 'CONSECUTIVE_DAYS',
      threshold: 7
    },
    isSecret: false
  },
  {
    title: "Night Owl",
    description: "Take measurements during night hours",
    category: 'SECRET' as AchievementCategory,
    tier: 'SILVER' as AchievementTier,
    points: 300,
    icon: '🦉',
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
    const { requirements, ...achievementData } = achievement;
    await prisma.achievement.create({
      data: {
        ...achievementData,
        requirements: JSON.parse(JSON.stringify(requirements))
      },
    });
  }
  
  console.log('Achievement seeding completed');
}
