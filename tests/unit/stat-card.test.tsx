import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatCard } from '@components/gamification/stat-card';

describe('StatCard', () => {
    const defaultProps = {
        label: 'Total Measurements',
        value: 1234,
        icon: '📊',
    };

    it('renders with all required props', () => {
        render(<StatCard {...defaultProps} />);

        expect(screen.getByRole('region')).toBeInTheDocument();
        expect(screen.getByText('Total Measurements')).toBeInTheDocument();
        expect(screen.getByText('1,234')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Total Measurements icon' })).toHaveTextContent('📊');
    });

    it('handles missing trend data gracefully', () => {
        render(<StatCard {...defaultProps} />);

        // Should not show trend element when trend is undefined
        expect(screen.queryByText('%')).not.toBeInTheDocument();
    });

    it('displays positive trends with correct styling', () => {
        render(<StatCard {...defaultProps} trend={12} />);

        const trendElement = screen.getByText('+12%');
        expect(trendElement).toHaveClass('text-green-600');
        expect(trendElement).toHaveAccessibleName('Increase of 12%');
    });

    it('displays negative trends with correct styling', () => {
        render(<StatCard {...defaultProps} trend={-5} />);

        const trendElement = screen.getByText('-5%');
        expect(trendElement).toHaveClass('text-red-600');
        expect(trendElement).toHaveAccessibleName('Decrease of 5%');
    });

    it('formats large numbers correctly', () => {
        render(<StatCard {...defaultProps} value={1234567} />);

        expect(screen.getByLabelText('Total Measurements value')).toHaveTextContent('1,234,567');
    });

    it('maintains accessibility with proper ARIA labels', () => {
        render(<StatCard {...defaultProps} trend={15} />);

        // Check region label
        expect(screen.getByRole('region')).toHaveAccessibleName('Total Measurements statistics');

        // Check icon label
        expect(screen.getByRole('img')).toHaveAccessibleName('Total Measurements icon');

        // Check value label
        expect(screen.getByLabelText('Total Measurements value')).toBeInTheDocument();

        // Check trend label
        expect(screen.getByText('+15%')).toHaveAccessibleName('Increase of 15%');
    });

    it('handles zero trend value correctly', () => {
        render(<StatCard {...defaultProps} trend={0} />);

        const trendElement = screen.getByText('0%');
        expect(trendElement).toHaveClass('text-green-600');
        expect(trendElement).toHaveAccessibleName('Increase of 0%');
    });

    it('handles decimal values correctly', () => {
        render(<StatCard {...defaultProps} value={1234.56} />);

        expect(screen.getByLabelText('Total Measurements value')).toHaveTextContent('1,234.56');
    });

    it('handles very large numbers correctly', () => {
        render(<StatCard {...defaultProps} value={1e9} />);

        expect(screen.getByLabelText('Total Measurements value')).toHaveTextContent('1,000,000,000');
    });

    it('maintains consistent layout with different content lengths', () => {
        const { rerender } = render(<StatCard {...defaultProps} />);

        // Get initial layout
        const initialCard = screen.getByRole('region');
        const initialLayout = initialCard.className;

        // Test with longer content
        rerender(
            <StatCard
                {...defaultProps}
                label="Very Long Label That Could Break Layout"
                value={1234567890}
                trend={100}
            />
        );

        const updatedCard = screen.getByRole('region');
        expect(updatedCard.className).toBe(initialLayout);
    });

    it('handles empty icon gracefully', () => {
        render(<StatCard {...defaultProps} icon="" />);

        const icon = screen.getByRole('img', { name: 'Total Measurements icon' });
        expect(icon).toBeInTheDocument();
        expect(icon).toHaveTextContent('');
    });
});
