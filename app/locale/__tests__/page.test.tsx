import { render, screen } from '@testing-library/react';
import LocalePage from '../../[locale]/page';
import { useTranslations } from 'next-intl';
import { brandConfig } from 'lib/branding';

// Mock next-intl
jest.mock('next-intl', () => ({
    useTranslations: jest.fn().mockImplementation(() => (key: string) => key),
    useParams: jest.fn().mockReturnValue({ locale: 'en' }),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
    useParams: jest.fn().mockReturnValue({ locale: 'en' }),
}));

// Mock components
jest.mock('components/brand/logo', () => ({
    Logo: () => <div data-testid="brand-logo">Logo</div>,
}));

jest.mock('components/ui/icons', () => ({
    Icons: {
        signal: () => <div data-testid="icon-signal">Signal Icon</div>,
        wifi: () => <div data-testid="icon-wifi">Wifi Icon</div>,
        map: () => <div data-testid="icon-map">Map Icon</div>,
        trophy: () => <div data-testid="icon-trophy">Trophy Icon</div>,
        star: () => <div data-testid="icon-star">Star Icon</div>,
        flame: () => <div data-testid="icon-flame">Flame Icon</div>,
    },
}));

// Mock Badge component
jest.mock('components/ui/badge', () => ({
    Badge: ({ children, className }: { children: React.ReactNode; className?: string }) => (
        <div data-testid="badge" className={className}>{children}</div>
    ),
}));

describe('LocalePage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders the logo', () => {
        render(<LocalePage />);
        expect(screen.getByTestId('brand-logo')).toBeInTheDocument();
    });

    it('renders navigation links with correct paths', () => {
        render(<LocalePage />);

        // Check each navigation link exists with correct href
        const wifiLink = screen.getByRole('link', { name: 'wifi' });
        expect(wifiLink).toHaveAttribute('href', '/en/wifi-finder');

        const coverageLink = screen.getByRole('link', { name: 'coverage' });
        expect(coverageLink).toHaveAttribute('href', '/en/coverage-finder');

        const mapLink = screen.getByRole('link', { name: 'home' });
        expect(mapLink).toHaveAttribute('href', '/en/map');

        const leaderboardLink = screen.getByRole('link', { name: 'leaderboard' });
        expect(leaderboardLink).toHaveAttribute('href', '/en/leaderboard');

        const signInLink = screen.getByRole('link', { name: 'signIn' });
        expect(signInLink).toHaveAttribute('href', '/en/auth/signin');
    });

    it('renders hero section with correct structure', () => {
        render(<LocalePage />);

        // Check for the feature badge
        const badge = screen.getByTestId('badge');
        expect(badge).toHaveClass('text-primary-500');
        expect(badge).toHaveTextContent('featuringNow.title');

        // Check for the main heading
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading).toHaveTextContent('title');
        expect(heading).toHaveClass(
            'bg-clip-text',
            'text-transparent',
            'bg-gradient-to-r'
        );
    });

    it('renders feature sections with icons', () => {
        render(<LocalePage />);

        // Check for feature icons
        expect(screen.getByTestId('icon-signal')).toBeInTheDocument();
        expect(screen.getByTestId('icon-wifi')).toBeInTheDocument();
        expect(screen.getByTestId('icon-map')).toBeInTheDocument();

        // Check for feature titles
        expect(screen.getByText('features.cellular.title')).toBeInTheDocument();
        expect(screen.getByText('features.wifi.title')).toBeInTheDocument();
        expect(screen.getByText('features.navigation.title')).toBeInTheDocument();
    });

    it('renders gamification section with icons', () => {
        render(<LocalePage />);

        // Check for gamification icons
        expect(screen.getByTestId('icon-trophy')).toBeInTheDocument();
        expect(screen.getByTestId('icon-star')).toBeInTheDocument();
        expect(screen.getByTestId('icon-flame')).toBeInTheDocument();

        // Check for gamification titles
        expect(screen.getByText('gamification.points.title')).toBeInTheDocument();
        expect(screen.getByText('gamification.badges.title')).toBeInTheDocument();
        expect(screen.getByText('gamification.leaderboard.title')).toBeInTheDocument();
    });

    it('renders call-to-action section with correct styling', () => {
        render(<LocalePage />);
        const ctaTitle = screen.getByText('testimonials.title');
        const ctaSection = ctaTitle.closest('div.bg-gradient-to-r');
        expect(ctaSection).toHaveClass(
            'bg-gradient-to-r',
            'from-primary-400/10',
            'to-primary-500/10',
            'rounded-3xl'
        );
    });

    it('uses translations with correct namespaces', () => {
        render(<LocalePage />);
        expect(useTranslations).toHaveBeenCalledWith('home');
        expect(useTranslations).toHaveBeenCalledWith('navigation');
    });

    it('applies consistent button styling', () => {
        render(<LocalePage />);
        const primaryButton = screen.getByRole('link', { name: 'findCoverageButton' });
        expect(primaryButton).toHaveClass(
            'bg-gradient-to-r',
            'from-primary-400',
            'to-primary-500'
        );
    });

    it('applies hover effects to navigation links', () => {
        render(<LocalePage />);
        const navLinks = screen.getAllByRole('link').filter(link =>
            link.className.includes('text-sm font-medium transition-colors')
        );

        navLinks.forEach(link => {
            expect(link.className).toContain('hover:text-primary');
            expect(link.className).toContain('after:bg-gradient-to-r');
        });
    });
});
