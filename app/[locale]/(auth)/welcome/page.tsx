import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function WelcomePage() {
  const t = useTranslations('Welcome');
  const { locale } = useTranslations();

  return (
    <div className="container flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">{t('nextSteps')}</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>{t('step1')}</li>
                <li>{t('step2')}</li>
                <li>{t('step3')}</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <Button asChild>
              <Link href={`/${locale}/dashboard`}>{t('startExploring')}</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/profile`}>{t('setupProfile')}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
