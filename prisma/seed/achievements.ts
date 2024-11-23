import { PrismaClient, Achievement } from '@prisma/client';

const achievements: Omit<Achievement, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    category: 'CONTRIBUTION',
    title: 'First Steps',
    description: 'Make your first signal measurement',
    points: 50,
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
    title: 'Rural Explorer',
    description: 'Map signal strength in 5 different rural areas',
    points: 200,
    icon: '🌾',
    tier: 'SILVER',
    requirements: {
      type: 'RURAL_MEASUREMENTS',
      threshold: 5
    },
    isSecret: false
  },
  {
    category: 'STREAK',
    title: 'Consistency Champion',
    description: 'Maintain a 7-day measurement streak',
    points: 300,
    icon: '🔥',
    tier: 'GOLD',
    requirements: {
      type: 'CONSECUTIVE_DAYS',
      threshold: 7
    },
    isSecret: false
  },
  {
    category: 'QUALITY',
    title: 'Accuracy Master',
    description: 'Achieve 95% accuracy in your measurements',
    points: 500,
    icon: '🎯',
    tier: 'PLATINUM',
    requirements: {
      type: 'ACCURACY_RATE',
      threshold: 95
    },
    isSecret: false
  },
  {
    category: 'VERIFICATION',
    title: 'Community Guardian',
    description: 'Verify 50 measurements from other users',
    points: 250,
    icon: '🛡️',
    tier: 'SILVER',
    requirements: {
      type: 'VERIFICATIONS',
      threshold: 50
    },
    isSecret: false
  },
  {
    category: 'SECRET',
    title: 'Night Owl',
    description: 'Make measurements during late night hours',
    points: 100,
    icon: '🦉',
    tier: 'BRONZE',
    requirements: {
      type: 'TIME_BASED',
      startHour: 22,
      endHour: 4
    },
    isSecret: true
  }
];

export async function seedAchievements(prisma: PrismaClient) {
  console.log('Seeding achievements...');
  
  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { title: achievement.title },
      update: achievement,
      create: achievement,
    });
  }
  
  console.log('Achievement seeding completed');
}
