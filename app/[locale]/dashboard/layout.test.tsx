import { render, screen, fireEvent } from '@testing-library/react';
import DashboardLayout from './layout';
import { useTranslations } from 'next-intl';

// Mock next-intl
jest.mock('next-intl', () => ({
    useTranslations: jest.fn().mockReturnValue((key: string) => key),
}));

describe('DashboardLayout', () => {
    const renderDashboardLayout = () => {
        return render(
            <DashboardLayout>
                <div>Test Content</div>
            </DashboardLayout>
        );
    };

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    it('renders the logo', () => {
        renderDashboardLayout();
        expect(screen.getByRole('link', { name: /wifey/i })).toBeInTheDocument();
    });

    it('renders navigation links', () => {
        renderDashboardLayout();
        expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /map/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /leaderboard/i })).toBeInTheDocument();
    });

    it('renders quick report button', () => {
        renderDashboardLayout();
        expect(screen.getByRole('link', { name: /quickReport/i })).toBeInTheDocument();
    });

    it('renders notifications button with badge', () => {
        renderDashboardLayout();
        const notificationsButton = screen.getByRole('button', { name: /view notifications/i });
        expect(notificationsButton).toBeInTheDocument();
        const badge = screen.getByText('3');
        expect(badge).toBeInTheDocument();
        expect(badge).toHaveClass('bg-gradient-to-r', 'from-primary-400', 'to-primary-500');
    });

    it('renders user menu', () => {
        renderDashboardLayout();
        expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
    });

    it('renders child content', () => {
        renderDashboardLayout();
        expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('displays notifications when clicked', () => {
        renderDashboardLayout();
        const notificationsButton = screen.getByRole('button', { name: /view notifications/i });
        fireEvent.click(notificationsButton);

        expect(screen.getByText('Mark all as read')).toBeInTheDocument();
        expect(screen.getByText('New Coverage Point')).toBeInTheDocument();
        expect(screen.getByText('Achievement Unlocked')).toBeInTheDocument();
        expect(screen.getByText('WiFi Point Added')).toBeInTheDocument();
    });

    it('displays user menu when clicked', () => {
        renderDashboardLayout();
        const userMenuButton = screen.getByRole('button', { name: /user menu/i });
        fireEvent.click(userMenuButton);

        expect(screen.getByText('Test User')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /profile/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /sign ?out/i })).toBeInTheDocument();
    });

    it('uses translations for all text content', () => {
        renderDashboardLayout();
        expect(useTranslations).toHaveBeenCalledWith('header');
    });

    it('applies correct branding styles', () => {
        renderDashboardLayout();

        // Check gradient classes on quick report button
        const quickReportButton = screen.getByRole('link', { name: /quickReport/i });
        expect(quickReportButton).toHaveClass(
            'bg-gradient-to-r',
            'from-primary-400',
            'to-primary-500'
        );

        // Check navigation hover effects
        const navLinks = screen.getAllByRole('link', { name: /(dashboard|map|leaderboard)/i });
        navLinks.forEach(link => {
            expect(link).toHaveClass(
                'after:bg-gradient-to-r',
                'after:from-primary-400',
                'after:to-primary-500'
            );
        });
    });
});
