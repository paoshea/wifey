import { render, screen } from '@testing-library/react';
import { Logo } from './logo';
import { brandConfig } from '@/lib/branding';

describe('Logo', () => {
    it('renders default logo with brand name', () => {
        render(<Logo />);
        expect(screen.getByText(brandConfig.name)).toBeInTheDocument();
    });

    it('renders icon-only variant', () => {
        render(<Logo variant="icon" />);
        expect(screen.queryByText(brandConfig.name)).not.toBeInTheDocument();
    });

    it('applies correct size classes', () => {
        const { rerender } = render(<Logo size="sm" />);
        expect(screen.getByRole('img', { hidden: true })).toHaveClass('h-6', 'w-6');

        rerender(<Logo size="md" />);
        expect(screen.getByRole('img', { hidden: true })).toHaveClass('h-8', 'w-8');

        rerender(<Logo size="lg" />);
        expect(screen.getByRole('img', { hidden: true })).toHaveClass('h-10', 'w-10');
    });

    it('applies custom className', () => {
        const customClass = 'test-class';
        render(<Logo className={customClass} />);
        expect(screen.getByRole('img', { hidden: true }).parentElement).toHaveClass(customClass);
    });
});
