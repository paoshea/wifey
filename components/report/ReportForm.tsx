'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save } from 'lucide-react';

interface Location {
  lat: number;
  lng: number;
  accuracy: number;
}

interface ReportFormProps {
  initialLocation?: Location | null;
  offlineMode?: boolean;
}

interface Report {
  location: Location;
  type: string;
  provider: string;
  description: string;
  contact?: string;
  timestamp: number;
}

const STORAGE_KEY = 'wifey_offline_reports';

export function ReportForm({ initialLocation, offlineMode = false }: ReportFormProps) {
  const t = useTranslations('report');
  const [type, setType] = useState('');
  const [provider, setProvider] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const saveOfflineReport = (report: Report) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const reports: Report[] = stored ? JSON.parse(stored) : [];
      reports.push(report);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch (e) {
      console.error('Failed to save report offline:', e);
      throw new Error('Failed to save report offline');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSaving(true);

    if (!initialLocation) {
      setError(t('errors.noLocation'));
      setIsSaving(false);
      return;
    }

    const report: Report = {
      location: initialLocation,
      type,
      provider,
      description,
      contact: contact || undefined,
      timestamp: Date.now()
    };

    try {
      if (offlineMode) {
        saveOfflineReport(report);
        setSuccess(true);
      } else {
        // TODO: Implement online submission
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSuccess(true);
      }

      // Clear form
      setType('');
      setProvider('');
      setDescription('');
      setContact('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errors.unknown'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="type">{t('type')}</Label>
        <Select
          value={type}
          onValueChange={setType}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('selectType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="coverage">Coverage Issue</SelectItem>
            <SelectItem value="speed">Speed Problem</SelectItem>
            <SelectItem value="connection">Connection Problem</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="provider">{t('provider')}</Label>
        <Select
          value={provider}
          onValueChange={setProvider}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('selectProvider')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="movistar">Movistar</SelectItem>
            <SelectItem value="claro">Claro</SelectItem>
            <SelectItem value="kolbi">Kölbi</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="description">{t('description')}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('descriptionPlaceholder')}
          className="h-32"
        />
      </div>

      <div>
        <Label htmlFor="contact">{t('contact')}</Label>
        <Input
          id="contact"
          type="email"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={t('contactPlaceholder')}
        />
      </div>

      {initialLocation && (
        <div className="text-sm text-muted-foreground">
          <p>{t('locationSelected')}:</p>
          <p>
            {initialLocation.lat.toFixed(6)}, {initialLocation.lng.toFixed(6)}
            <br />
            {t('accuracy')}: ±{Math.round(initialLocation.accuracy)}m
          </p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isSaving || !initialLocation}
        className="w-full"
      >
        <Save className="mr-2 h-4 w-4" />
        {offlineMode ? t('saveOffline') : t('submit')}
      </Button>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {success && (
        <p className="text-sm text-green-600">
          {offlineMode ? t('savedOffline') : t('submitted')}
        </p>
      )}
    </form>
  );
}
