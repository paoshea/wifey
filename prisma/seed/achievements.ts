import { PrismaClient } from '@prisma/client';
import { ComparisonOperator } from '../types';

export interface AchievementRequirement {
  type: 'achievement';
  metric: string;
  operator: ComparisonOperator;
  value: number;
  description: string;
}

export interface AchievementTemplate {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: string;
  type: string;
  requirements: AchievementRequirement[];
}

const achievementTemplates: AchievementTemplate[] = [
  {
    id: 'first-steps',
    title: 'First Steps',
    description: 'Begin your journey by making your first measurement',
    points: 100,
    icon: '🎯',
    type: 'measurement',
    requirements: [
      {
        type: 'achievement',
        metric: 'totalMeasurements',
        operator: ComparisonOperator.GTE,
        value: 1,
        description: 'Make your first measurement'
      }
    ]
  },
  {
    id: 'consistent-contributor',
    title: 'Consistent Contributor',
    description: 'Maintain a 7-day measurement streak',
    points: 500,
    icon: '🔥',
    type: 'streak',
    requirements: [
      {
        type: 'achievement',
        metric: 'consecutiveDays',
        operator: ComparisonOperator.GTE,
        value: 7,
        description: 'Maintain a streak of 7 days'
      }
    ]
  },
  {
    id: 'quality-master',
    title: 'Quality Master',
    description: 'Achieve a high quality score across your measurements',
    points: 300,
    icon: '⭐',
    type: 'quality',
    requirements: [
      {
        type: 'achievement',
        metric: 'qualityScore',
        operator: ComparisonOperator.GTE,
        value: 90,
        description: 'Maintain a quality score of 90 or higher'
      }
    ]
  },
  {
    id: 'rural-explorer',
    title: 'Rural Explorer',
    description: 'Map connectivity in rural areas',
    points: 400,
    icon: '🌾',
    type: 'measurement',
    requirements: [
      {
        type: 'achievement',
        metric: 'ruralMeasurements',
        operator: ComparisonOperator.GTE,
        value: 10,
        description: 'Make 10 measurements in rural areas'
      }
    ]
  },
  {
    id: 'distance-champion',
    title: 'Distance Champion',
    description: 'Cover significant distance while mapping',
    points: 300,
    icon: '🏃',
    type: 'distance',
    requirements: [
      {
        type: 'achievement',
        metric: 'totalDistance',
        operator: ComparisonOperator.GTE,
        value: 100,
        description: 'Cover 100km while making measurements'
      }
    ]
  }
];

export async function seedAchievements(prisma: PrismaClient, userId: string) {
  const achievements = [];

  for (const template of achievementTemplates) {
    const achievement = await prisma.achievement.create({
      data: {
        title: template.title,
        description: template.description,
        points: template.points,
        icon: template.icon,
        type: template.type,
        userId: userId,
        requirements: JSON.stringify(template.requirements, null, 2),
        progress: 0,
        target: template.requirements[0].value,
        tier: 'COMMON',
        completed: false
      }
    });

    achievements.push(achievement);
  }

  return achievements;
}

export async function createDefaultAchievements(prisma: PrismaClient, userId: string) {
  try {
    const achievements = await seedAchievements(prisma, userId);
    console.log(`Created ${achievements.length} achievements for user ${userId}`);
    return achievements;
  } catch (error) {
    console.error('Error creating default achievements:', error);
    throw error;
  }
}
