export interface LeaderboardUser {
  id: string;
  name: string;
  points: number;
  rank: number;
  avatar?: string;
  contributions: {
    total: number;
    cellular: number;
    wifi: number;
  };
  badges: {
    id: string;
    name: string;
    icon: string;
  }[];
  streak: {
    current: number;
    best: number;
  };
}

export interface LeaderboardStats {
  totalUsers: number;
  totalContributions: number;
  userRank?: number; // Only present for authenticated users
  userPoints?: number;
}
