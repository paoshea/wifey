'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, Signal, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddPointProps {
  type: 'coverage' | 'wifi';
}

export function AddPoint({ type }: AddPointProps) {
  const t = useTranslations('points');
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement point submission
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          size="lg"
        >
          {type === 'coverage' ? (
            <Signal className="h-5 w-5" />
          ) : (
            <Wifi className="h-5 w-5" />
          )}
          {t('addNew')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === 'coverage' ? t('addCoveragePoint') : t('addWifiPoint')}
          </DialogTitle>
          <DialogDescription>
            {t('helpOthers')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('locationName')}</Label>
            <Input id="name" placeholder={t('locationNamePlaceholder')} required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="provider">{t('provider')}</Label>
            <Input id="provider" placeholder={t('providerPlaceholder')} required />
          </div>

          {type === 'coverage' ? (
            <div className="space-y-2">
              <Label htmlFor="strength">{t('signalStrength')}</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t('selectStrength')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">{t('excellent')}</SelectItem>
                  <SelectItem value="good">{t('good')}</SelectItem>
                  <SelectItem value="fair">{t('fair')}</SelectItem>
                  <SelectItem value="poor">{t('poor')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="speed">{t('speed')}</Label>
                <Input 
                  id="speed" 
                  placeholder={t('speedPlaceholder')} 
                  type="number" 
                  min="0"
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">{t('wifiType')}</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">{t('free')}</SelectItem>
                    <SelectItem value="paid">{t('paid')}</SelectItem>
                    <SelectItem value="restricted">{t('restricted')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">{t('notes')}</Label>
            <Input id="notes" placeholder={t('notesPlaceholder')} />
          </div>

          <Button type="submit" className="w-full">
            {t('submit')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
