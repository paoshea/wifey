import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatCard } from '../stat-card';

describe('StatCard', () => {
    const defaultProps = {
        label: 'Total Measurements',
        value: 150,
        icon: '📊',
    };

    it('renders with all required props', () => {
        render(<StatCard {...defaultProps} />);

        expect(screen.getByText('Total Measurements')).toBeInTheDocument();
        expect(screen.getByText('150')).toBeInTheDocument();
        expect(screen.getByText('📊')).toBeInTheDocument();
    });

    it('handles missing trend data gracefully', () => {
        render(<StatCard {...defaultProps} />);

        // Trend element should not be present
        const trendElements = screen.queryByText(/%/);
        expect(trendElements).not.toBeInTheDocument();
    });

    it('displays positive trends with correct styling', () => {
        render(<StatCard {...defaultProps} trend={12} />);

        const trendElement = screen.getByText('+12%');
        expect(trendElement).toHaveClass('text-green-600');
    });

    it('displays negative trends with correct styling', () => {
        render(<StatCard {...defaultProps} trend={-5} />);

        const trendElement = screen.getByText('-5%');
        expect(trendElement).toHaveClass('text-red-600');
    });

    it('formats large numbers correctly', () => {
        render(<StatCard {...defaultProps} value={1234567} />);

        // Should be formatted as "1,234,567"
        expect(screen.getByLabelText('Total Measurements value')).toHaveTextContent('1,234,567');
    });

    describe('accessibility', () => {
        it('provides proper ARIA labels', () => {
            render(<StatCard {...defaultProps} trend={15} />);

            // Check region label
            expect(screen.getByRole('region')).toHaveAttribute(
                'aria-label',
                'Total Measurements statistics'
            );

            // Check icon label
            expect(screen.getByRole('img', { name: 'Total Measurements icon' })).toBeInTheDocument();

            // Check value label
            expect(screen.getByLabelText('Total Measurements value')).toBeInTheDocument();
        });

        it('provides descriptive trend labels', () => {
            render(<StatCard {...defaultProps} trend={15} />);

            expect(screen.getByLabelText('Increase of 15%')).toBeInTheDocument();
        });

        it('handles negative trend descriptions', () => {
            render(<StatCard {...defaultProps} trend={-8} />);

            expect(screen.getByLabelText('Decrease of 8%')).toBeInTheDocument();
        });
    });

    describe('edge cases', () => {
        it('handles zero values', () => {
            render(<StatCard {...defaultProps} value={0} />);
            expect(screen.getByLabelText('Total Measurements value')).toHaveTextContent('0');
        });

        it('handles zero trends', () => {
            render(<StatCard {...defaultProps} trend={0} />);
            expect(screen.getByText('0%')).toBeInTheDocument();
        });

        it('handles very large numbers', () => {
            render(<StatCard {...defaultProps} value={1e9} />);
            expect(screen.getByLabelText('Total Measurements value')).toHaveTextContent('1,000,000,000');
        });

        it('handles decimal values', () => {
            render(<StatCard {...defaultProps} value={1234.56} />);
            expect(screen.getByLabelText('Total Measurements value')).toHaveTextContent('1,234.56');
        });
    });

    describe('visual presentation', () => {
        it('applies consistent spacing', () => {
            const { container } = render(<StatCard {...defaultProps} />);
            const card = container.firstChild as HTMLElement;

            expect(card).toHaveClass('p-4');
            expect(card).toHaveClass('rounded-lg');
        });

        it('maintains proper text hierarchy', () => {
            render(<StatCard {...defaultProps} />);

            const value = screen.getByLabelText('Total Measurements value');
            expect(value).toHaveClass('text-2xl', 'font-bold');
        });

        it('applies proper icon sizing', () => {
            render(<StatCard {...defaultProps} />);

            const icon = screen.getByRole('img', { name: 'Total Measurements icon' });
            expect(icon).toHaveClass('text-2xl');
        });
    });

    describe('responsive behavior', () => {
        it('maintains layout at different sizes', () => {
            const { container } = render(<StatCard {...defaultProps} trend={15} />);
            const card = container.firstChild as HTMLElement;

            // Check flex layout
            expect(card.querySelector('.flex')).toHaveClass('items-center', 'justify-between');
        });
    });

    describe('internationalization', () => {
        it('formats numbers according to locale', () => {
            const originalToLocaleString = Number.prototype.toLocaleString;
            // Mock toLocaleString to simulate different locale
            Number.prototype.toLocaleString = function () {
                return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            };

            render(<StatCard {...defaultProps} value={1234567} />);
            expect(screen.getByLabelText('Total Measurements value')).toHaveTextContent('1.234.567');

            // Restore original method
            Number.prototype.toLocaleString = originalToLocaleString;
        });
    });
});
