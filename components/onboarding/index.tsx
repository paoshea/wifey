import { useState } from 'react';
import { Welcome } from './welcome';
import { CoverageIntro } from './coverage-intro';
import { CoverageDemo } from './coverage-demo';
import { Features } from './features';
import { Registration } from './registration';

export function Onboarding() {
  const [step, setStep] = useState<
    'welcome' | 'coverage-intro' | 'coverage-demo' | 'features' | 'registration'
  >('welcome');

  const handleNext = () => {
    switch (step) {
      case 'welcome':
        setStep('coverage-intro');
        break;
      case 'coverage-intro':
        setStep('coverage-demo');
        break;
      case 'coverage-demo':
        setStep('features');
        break;
      case 'features':
        setStep('registration');
        break;
      case 'registration':
        // TODO: Handle onboarding completion
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {step === 'welcome' && <Welcome onNext={handleNext} />}
      {step === 'coverage-intro' && <CoverageIntro onNext={handleNext} />}
      {step === 'coverage-demo' && <CoverageDemo onNext={handleNext} />}
      {step === 'features' && <Features onNext={handleNext} />}
      {step === 'registration' && <Registration onNext={handleNext} />}
    </div>
  );
}
