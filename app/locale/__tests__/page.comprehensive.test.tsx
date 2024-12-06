import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

// Mock next/image
jest.mock('next/image', () => ({
    __esModule: true,
    default: (props: any) => <img {...props} />,
}));

// Mock components
jest.mock('components/brand/logo', () => ({
    Logo: () => <div data-testid="brand-logo">Logo</div>,
}));

// Mock icons with aria-hidden
jest.mock('components/ui/icons', () => ({
    Icons: {
        signal: () => <div data-testid="icon-signal" aria-hidden="true">Signal Icon</div>,
        wifi: () => <div data-testid="icon-wifi" aria-hidden="true">Wifi Icon</div>,
        map: () => <div data-testid="icon-map" aria-hidden="true">Map Icon</div>,
        trophy: () => <div data-testid="icon-trophy" aria-hidden="true">Trophy Icon</div>,
        star: () => <div data-testid="icon-star" aria-hidden="true">Star Icon</div>,
        flame: () => <div data-testid="icon-flame" aria-hidden="true">Flame Icon</div>,
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

    // 1. Rendering & Structure Tests
    describe('Rendering & Structure', () => {
        it('renders all main sections', () => {
            render(<LocalePage />);
            expect(screen.getByRole('navigation')).toBeInTheDocument();
            expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
            expect(screen.getByTestId('badge')).toBeInTheDocument();

            // Check for all major sections
            const sections = screen.getAllByRole('region');
            expect(sections).toHaveLength(4); // Hero, Features, Gamification, CTA
        });

        it('renders all feature cards', () => {
            render(<LocalePage />);
            expect(screen.getByText('features.cellular.title')).toBeInTheDocument();
            expect(screen.getByText('features.wifi.title')).toBeInTheDocument();
            expect(screen.getByText('features.navigation.title')).toBeInTheDocument();
        });

        it('renders all gamification cards', () => {
            render(<LocalePage />);
            expect(screen.getByText('gamification.points.title')).toBeInTheDocument();
            expect(screen.getByText('gamification.badges.title')).toBeInTheDocument();
            expect(screen.getByText('gamification.leaderboard.title')).toBeInTheDocument();
        });
    });

    // 2. Navigation & Links Tests
    describe('Navigation & Links', () => {
        it('renders all navigation links with correct hrefs', () => {
            render(<LocalePage />);
            const links = [
                { name: 'wifi', href: '/en/wifi-finder' },
                { name: 'coverage', href: '/en/coverage-finder' },
                { name: 'home', href: '/en/map' },
                { name: 'leaderboard', href: '/en/leaderboard' },
                { name: 'signIn', href: '/en/auth/signin' },
            ];

            links.forEach(({ name, href }) => {
                const link = screen.getByRole('link', { name });
                expect(link).toHaveAttribute('href', href);
            });
        });

        it('renders CTA links with correct hrefs', () => {
            render(<LocalePage />);
            const findCoverageButton = screen.getByRole('link', { name: 'findCoverageButton' });
            expect(findCoverageButton).toHaveAttribute('href', '/en/wifi-finder');

            const getStartedButton = screen.getByRole('link', { name: 'getStarted' });
            expect(getStartedButton).toHaveAttribute('href', '/en/auth/signin');
        });
    });

    // 3. Accessibility Tests
    describe('Accessibility', () => {
        it('has correct ARIA labels', () => {
            render(<LocalePage />);
            expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Main navigation');
            expect(screen.getByRole('heading', { level: 1 })).toHaveAttribute('id', 'hero-title');
        });

        it('has proper heading hierarchy', () => {
            render(<LocalePage />);
            const h1 = screen.getAllByRole('heading', { level: 1 });
            const h2 = screen.getAllByRole('heading', { level: 2 });
            const h3 = screen.getAllByRole('heading', { level: 3 });

            expect(h1).toHaveLength(1);
            expect(h2).toHaveLength(3); // Features, Gamification, CTA
            expect(h3).toHaveLength(6); // 3 features + 3 gamification cards
        });

        it('marks decorative icons as aria-hidden', () => {
            render(<LocalePage />);
            const icons = [
                screen.getByTestId('icon-signal'),
                screen.getByTestId('icon-wifi'),
                screen.getByTestId('icon-map'),
                screen.getByTestId('icon-trophy'),
                screen.getByTestId('icon-star'),
                screen.getByTestId('icon-flame'),
            ];

            icons.forEach(icon => {
                expect(icon).toHaveAttribute('aria-hidden', 'true');
            });
        });
    });

    // 4. Styling & Visual Elements Tests
    describe('Styling & Visual Elements', () => {
        it('applies gradient text styling to headings', () => {
            render(<LocalePage />);
            const gradientHeadings = screen.getAllByRole('heading')
                .filter(heading => heading.className.includes('bg-gradient-to-r'));

            expect(gradientHeadings.length).toBeGreaterThan(0);
            gradientHeadings.forEach(heading => {
                expect(heading).toHaveClass(
                    'bg-clip-text',
                    'text-transparent',
                    'bg-gradient-to-r'
                );
            });
        });

        it('applies consistent button styling', () => {
            render(<LocalePage />);
            const primaryButtons = screen.getAllByRole('link')
                .filter(link => link.className.includes('bg-gradient-to-r from-primary-400 to-primary-500'));

            expect(primaryButtons.length).toBeGreaterThan(0);
            primaryButtons.forEach(button => {
                expect(button.className).toContain('bg-gradient-to-r');
                expect(button.className).toContain('from-primary-400');
                expect(button.className).toContain('to-primary-500');
            });
        });

        it('applies hover effects to navigation links', () => {
            render(<LocalePage />);
            const navLinks = screen.getAllByRole('link')
                .filter(link => link.className.includes('text-sm font-medium'));

            navLinks.forEach(link => {
                expect(link.className).toContain('hover:text-primary');
                expect(link.className).toContain('after:bg-gradient-to-r');
            });
        });
    });

    // 5. Translation Tests
    describe('Translations', () => {
        it('uses correct translation namespaces', () => {
            render(<LocalePage />);
            expect(useTranslations).toHaveBeenCalledWith('home');
            expect(useTranslations).toHaveBeenCalledWith('navigation');
        });

        it('applies translations to all text content', () => {
            render(<LocalePage />);
            const translatedElements = [
                'title',
                'subtitle',
                'features.title',
                'features.subtitle',
                'gamification.title',
                'gamification.subtitle',
                'testimonials.title',
                'testimonials.subtitle',
            ];

            translatedElements.forEach(key => {
                expect(screen.getByText(key)).toBeInTheDocument();
            });
        });
    });

    // 6. Responsive Behavior Tests
    describe('Responsive Behavior', () => {
        it('applies responsive classes correctly', () => {
            render(<LocalePage />);
            const responsiveElements = screen.getAllByRole('link')
                .filter(link => link.className.includes('sm:') || link.className.includes('lg:'));

            expect(responsiveElements.length).toBeGreaterThan(0);
            responsiveElements.forEach(element => {
                const hasResponsiveClass = element.className.match(/sm:|md:|lg:|xl:/);
                expect(hasResponsiveClass).toBeTruthy();
            });
        });

        it('hides mobile navigation by default', () => {
            render(<LocalePage />);
            const nav = screen.getByRole('navigation')
                .querySelector('.hidden.sm\\:flex');
            expect(nav).toBeInTheDocument();
        });
    });

    // 7. Interactive Elements Tests
    describe('Interactive Elements', () => {
        it('applies hover styles to buttons', () => {
            render(<LocalePage />);
            const buttons = screen.getAllByRole('link')
                .filter(link => link.className.includes('hover:'));

            buttons.forEach(button => {
                expect(button.className).toMatch(/hover:/);
            });
        });

        it('applies transition effects to interactive elements', () => {
            render(<LocalePage />);
            const transitionElements = screen.getAllByRole('link')
                .filter(link => link.className.includes('transition'));

            transitionElements.forEach(element => {
                expect(element.className).toContain('transition');
            });
        });
    });

    // 8. Performance Tests
    describe('Performance', () => {
        it('lazy loads images correctly', () => {
            render(<LocalePage />);
            const images = screen.getAllByRole('img');
            images.forEach(img => {
                expect(img).toHaveAttribute('loading', 'lazy');
            });
        });

        it('uses proper image formats and sizes', () => {
            render(<LocalePage />);
            const images = screen.getAllByRole('img');
            images.forEach(img => {
                expect(img).toHaveAttribute('width');
                expect(img).toHaveAttribute('height');
            });
        });
    });
});
