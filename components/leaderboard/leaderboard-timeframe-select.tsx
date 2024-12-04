'use client';

import { useTranslations } from 'next-intl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'components/ui/select';
import { TimeFrame } from 'lib/gamification/types';

interface LeaderboardTimeframeSelectProps {
  value: TimeFrame;
  onChange: (value: TimeFrame) => void;
}

export function LeaderboardTimeframeSelect({ value, onChange }: LeaderboardTimeframeSelectProps) {
  const t = useTranslations('leaderboard.timeframe');

  const handleTimeframeChange = (newValue: string) => {
    onChange(newValue as TimeFrame);
  };

  return (
    <Select value={value} onValueChange={handleTimeframeChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={t('label')} />
      </SelectTrigger>
      <SelectContent>
        {Object.values(TimeFrame).map((timeframe) => (
          <SelectItem key={timeframe} value={timeframe}>
            {t(timeframe)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
