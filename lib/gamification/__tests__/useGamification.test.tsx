import { renderHook, act } from '@testing-library/react';
import { useGamification } from '../hooks/useGamification';
import { GamificationService } from '../../services/gamification-service';
import { 
  ValidatedAchievement,
  ValidatedUserStats,
  RequirementType,
  RarityLevel,
  AchievementNotification
} from '../types';

// Mock the GamificationService
jest.mock('../../services/gamification-service');

describe('useGamification', () => {
  const mockUserId = 'test-user-id';
  
  const mockAchievement: ValidatedAchievement = {
    id: 'test-achievement',
    title: 'Test Achievement',
    description: 'Test Description',
    icon: '🎯',
    points: 100,
    rarity: RarityLevel.COMMON,
    requirements: [{
      type: RequirementType.MEASUREMENT_COUNT,
      value: 10,
      metric: 'measurements'
    }],
    isSecret: false,
    unlockedAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockUserStats: ValidatedUserStats = {
    measurementCount: 15,
    ruralMeasurements: 5,
    consecutiveDays: 3,
    accuracyRate: 95,
    verifications: 10,
    lastActiveAt: new Date()
  };

  const mockNotification: AchievementNotification = {
    achievement: mockAchievement,
    unlockedAt: new Date(),
    pointsEarned: 100
  };

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (GamificationService as jest.Mock).mockImplementation(() => ({
      getAchievements: jest.fn().mockResolvedValue([mockAchievement]),
      getUserStats: jest.fn().mockResolvedValue(mockUserStats),
      checkAndUnlockAchievements: jest.fn().mockResolvedValue([mockNotification]),
      updateUserStats: jest.fn().mockResolvedValue(mockUserStats)
    }));
  });

  it('should initialize with loading state', () => {
    const { result } = renderHook(() => useGamification(mockUserId));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.achievements).toEqual([]);
    expect(result.current.userStats).toBeNull();
  });

  it('should load achievements and stats', async () => {
    const { result } = renderHook(() => useGamification(mockUserId));

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.achievements).toEqual([mockAchievement]);
    expect(result.current.userStats).toEqual(mockUserStats);
  });

  it('should handle achievement notifications', async () => {
    const { result } = renderHook(() => useGamification(mockUserId));

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.notifications).toEqual([mockNotification]);
  });

  it('should dismiss notifications', async () => {
    const { result } = renderHook(() => useGamification(mockUserId));

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    act(() => {
      result.current.dismissNotification(mockNotification.achievement.id);
    });

    expect(result.current.notifications).toEqual([]);
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Failed to fetch');
    (GamificationService as jest.Mock).mockImplementation(() => ({
      getAchievements: jest.fn().mockRejectedValue(mockError),
      getUserStats: jest.fn().mockRejectedValue(mockError),
      checkAndUnlockAchievements: jest.fn().mockRejectedValue(mockError),
      updateUserStats: jest.fn().mockRejectedValue(mockError)
    }));

    const { result } = renderHook(() => useGamification(mockUserId));

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('should update stats and check achievements', async () => {
    const { result } = renderHook(() => useGamification(mockUserId));

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const mockUpdate = { measurementCount: 20 };
    await act(async () => {
      await result.current.updateStats(mockUpdate);
    });

    const service = (GamificationService as jest.Mock).mock.results[0].value;
    expect(service.updateUserStats).toHaveBeenCalledWith(mockUserId, mockUpdate);
    expect(service.checkAndUnlockAchievements).toHaveBeenCalled();
  });

  it('should check achievements on window focus', async () => {
    const { result } = renderHook(() => useGamification(mockUserId));

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Simulate window focus
    act(() => {
      window.dispatchEvent(new Event('focus'));
    });

    const service = (GamificationService as jest.Mock).mock.results[0].value;
    expect(service.checkAndUnlockAchievements).toHaveBeenCalled();
  });

  it('should clean up event listeners', () => {
    const { unmount } = renderHook(() => useGamification(mockUserId));
    
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    
    unmount();
    
    expect(removeEventListenerSpy).toHaveBeenCalledWith('focus', expect.any(Function));
  });
});
