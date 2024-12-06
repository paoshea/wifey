import { render, screen } from '@testing-library/react';
import LocalePage from './page';
import { useTranslations } from 'next-intl';
import { brandConfig } from '@/lib/branding';

// Mock next-intl
jest.mock('next-intl', () => ({
    useTranslations: jest.fn().mockImplementation(() => (key: string) => key),
}));

describe('LocalePage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the logo', () => {
        render(<LocalePage />);
        expect(screen.getByRole('link', { name: /wifey/i })).toBeInTheDocument();
    });

    it('renders navigation links', () => {
        render(<LocalePage />);
        expect(screen.getByRole('link', { name: /wifi/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /coverage/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /map/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /leaderboard/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /sign ?in/i })).toBeInTheDocument();
    });

    it('renders hero section with correct branding', () => {
        render(<LocalePage />);
        const heroTitle = screen.getByRole('heading', { level: 1 });
        expect(heroTitle).toHaveClass(
            'bg-clip-text',
            'text-transparent',
            'bg-gradient-to-r',
            'from-primary-400',
            'to-primary-500'
        );
    });

    it('renders feature sections', () => {
        render(<LocalePage />);
        expect(screen.getByText('features.cellular.title')).toBeInTheDocument();
        expect(screen.getByText('features.wifi.title')).toBeInTheDocument();
        expect(screen.getByText('features.navigation.title')).toBeInTheDocument();
    });

    it('renders gamification section', () => {
        render(<LocalePage />);
        expect(screen.getByText('gamification.points.title')).toBeInTheDocument();
        expect(screen.getByText('gamification.badges.title')).toBeInTheDocument();
        expect(screen.getByText('gamification.leaderboard.title')).toBeInTheDocument();
    });

    it('renders call-to-action section with correct styling', () => {
        render(<LocalePage />);
        const ctaSection = screen.getByText('testimonials.title').closest('div');
        expect(ctaSection).toHaveClass(
            'bg-gradient-to-r',
            'from-primary-400/10',
            'to-primary-500/10'
        );
    });

    it('uses translations for all text content', () => {
        render(<LocalePage />);
        expect(useTranslations).toHaveBeenCalledWith('home');
        expect(useTranslations).toHaveBeenCalledWith('navigation');
    });

    it('applies consistent branding styles to buttons', () => {
        render(<LocalePage />);
        const primaryButton = screen.getByRole('link', { name: /findCoverageButton/i });
        expect(primaryButton).toHaveClass(
            'bg-gradient-to-r',
            'from-primary-400',
            'to-primary-500'
        );
    });

    it('applies hover effects to navigation links', () => {
        render(<LocalePage />);
        const navLinks = screen.getAllByRole('link', { name: /(wifi|coverage|map|leaderboard)/i });
        navLinks.forEach(link => {
            expect(link).toHaveClass(
                'after:bg-gradient-to-r',
                'after:from-primary-400',
                'after:to-primary-500'
            );
        });
    });

    it('renders "Now Featuring" badge with correct styling', () => {
        render(<LocalePage />);
        const badge = screen.getByText('featuringNow.title');
        expect(badge).toHaveClass(
            'bg-gradient-to-r',
            'from-primary-400/10',
            'to-primary-500/10',
            'text-primary-500'
        );
    });

    it('applies consistent spacing and layout classes', () => {
        render(<LocalePage />);
        const mainSections = document.querySelectorAll('.max-w-7xl');
        mainSections.forEach(section => {
            expect(section).toHaveClass('mx-auto', 'px-4', 'sm:px-6', 'lg:px-8');
        });
    });
});
