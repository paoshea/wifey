export const useGamification = jest.fn().mockReturnValue({
    stats: {
        totalMeasurements: 150,
        ruralMeasurements: 75,
        uniqueLocations: 30,
        contributionScore: 450,
        measurementsTrend: 12,
        ruralTrend: 25,
        locationsTrend: 8,
        scoreTrend: 15
    },
    level: 5,
    levelProgress: 0.75,
    nextLevelThreshold: 1000,
    activityData: [
        { date: '2024-01-01', measurements: 10, ruralMeasurements: 5, uniqueLocations: 3 },
        { date: '2024-01-02', measurements: 15, ruralMeasurements: 8, uniqueLocations: 4 },
        { date: '2024-01-03', measurements: 12, ruralMeasurements: 6, uniqueLocations: 5 }
    ],
    milestones: [
        {
            id: '1',
            title: 'Rural Pioneer',
            description: 'Map your first rural area',
            completed: true,
            progress: 1,
            target: 1,
            icon: '🌲'
        },
        {
            id: '2',
            title: 'Coverage Expert',
            description: 'Map 100 locations',
            completed: false,
            progress: 30,
            target: 100,
            icon: '📍'
        }
    ],
    isLoading: false,
    error: null,
    processMeasurement: jest.fn().mockResolvedValue({
        points: 10,
        bonuses: {
            ruralArea: 5,
            qualityBonus: 2,
            firstInArea: 0,
            consistencyStreak: 3
        }
    }),
    getUserProgress: jest.fn().mockResolvedValue({
        level: 5,
        totalPoints: 450,
        achievements: ['FIRST_MEASUREMENT', 'RURAL_PIONEER']
    }),
    getLeaderboard: jest.fn().mockResolvedValue([
        { userId: 'user1', points: 100, rank: 1 },
        { userId: 'user2', points: 200, rank: 2 }
    ])
});
