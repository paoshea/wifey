import { motion } from 'framer-motion';

interface LevelProgressProps {
    level: number;
    progress: number;
    nextThreshold: number;
}

export function LevelProgress({ level, progress, nextThreshold }: LevelProgressProps) {
    const progressPercentage = Math.round(progress * 100);
    const remainingPoints = nextThreshold - Math.floor(progress * nextThreshold);
    const icon = level >= 15 ? '🏆' : '⭐️';
    const iconLabel = level >= 15 ? 'Trophy for high level' : 'Star for current level';

    return (
        <div
            className="bg-white p-6 rounded-lg shadow-sm"
            role="region"
            aria-label="Level Progress"
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold">Level {level}</h3>
                    <p
                        className="text-sm text-gray-500"
                        aria-label={`Progress to next level: ${progressPercentage}%`}
                    >
                        {progressPercentage}% to Level {level + 1}
                    </p>
                </div>
                <div
                    className="text-3xl"
                    role="img"
                    aria-label={iconLabel}
                >
                    {icon}
                </div>
            </div>

            <div
                className="relative h-4 bg-gray-200 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={progressPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
            >
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="absolute h-full bg-blue-600 rounded-full"
                />
            </div>

            <div
                className="mt-2 text-sm text-gray-500 text-right"
                aria-label={`${remainingPoints} points needed for next level`}
            >
                {remainingPoints} points to next level
            </div>
        </div>
    );
}
