-- CreateEnum
CREATE TYPE "AchievementTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
CREATE TYPE "BadgeType" AS ENUM ('CONTRIBUTOR', 'EXPLORER', 'VERIFIER', 'ANALYST');

-- AlterTable
ALTER TABLE "UserProgress" 
ADD COLUMN "currentExp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "nextLevelExp" INTEGER NOT NULL DEFAULT 100;

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userProgressId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStreak" (
    "id" TEXT NOT NULL,
    "userProgressId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastActiveDate" TIMESTAMP(3),
    "streakHistory" JSONB[] NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserStreak_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL,
    "userProgressId" TEXT NOT NULL,
    "badgeType" "BadgeType" NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "nextLevel" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "UserStats" 
ADD COLUMN "qualityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN "accuracyRate" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Achievement" 
ADD COLUMN "isSecret" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "requirements" JSONB NOT NULL,
ALTER COLUMN "tier" TYPE "AchievementTier" USING tier::text::"AchievementTier",
ADD CONSTRAINT "Achievement_title_key" UNIQUE ("title");

-- AlterTable
ALTER TABLE "LeaderboardEntry"
ADD COLUMN "metadata" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userProgressId_achievementId_key" ON "UserAchievement"("userProgressId", "achievementId");
CREATE INDEX "UserAchievement_userProgressId_idx" ON "UserAchievement"("userProgressId");
CREATE INDEX "UserAchievement_achievementId_idx" ON "UserAchievement"("achievementId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStreak_userProgressId_key" ON "UserStreak"("userProgressId");
CREATE INDEX "UserStreak_userProgressId_idx" ON "UserStreak"("userProgressId");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userProgressId_badgeType_key" ON "UserBadge"("userProgressId", "badgeType");
CREATE INDEX "UserBadge_userProgressId_idx" ON "UserBadge"("userProgressId");
CREATE INDEX "UserBadge_badgeType_idx" ON "UserBadge"("badgeType");

-- CreateIndex
CREATE INDEX "Achievement_tier_idx" ON "Achievement"("tier");

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userProgressId_fkey" FOREIGN KEY ("userProgressId") REFERENCES "UserProgress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStreak" ADD CONSTRAINT "UserStreak_userProgressId_fkey" FOREIGN KEY ("userProgressId") REFERENCES "UserProgress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBadge" ADD CONSTRAINT "UserBadge_userProgressId_fkey" FOREIGN KEY ("userProgressId") REFERENCES "UserProgress"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
