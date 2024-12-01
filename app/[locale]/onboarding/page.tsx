import OnboardingClient from '@/components/onboarding/onboarding-client';

export default function OnboardingPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  return <OnboardingClient locale={locale} />;
}