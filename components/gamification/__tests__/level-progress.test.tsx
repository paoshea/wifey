import React from 'react';
import { render, screen } from '@testing-library/react';
import { LevelProgress } from '../level-progress';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => (
            <div data-testid="progress-bar-animation" {...props}>
                {children}
            </div>
        ),
    },
}));

describe('LevelProgress', () => {
    const defaultProps = {
        level: 5,
        progress: 0.75, // 75%
        nextThreshold: 1000,
    };

    it('calculates percentage correctly', () => {
        render(<LevelProgress {...defaultProps} />);

        expect(screen.getByText('75% to Level 6')).toBeInTheDocument();
        expect(screen.getByLabelText('Progress to next level: 75%')).toBeInTheDocument();
    });

    it('displays appropriate icon based on level', () => {
        // Test low level (star)
        const { rerender } = render(<LevelProgress {...defaultProps} />);
        expect(screen.getByLabelText('Star for current level')).toHaveTextContent('⭐️');

        // Test high level (trophy)
        rerender(<LevelProgress {...defaultProps} level={15} />);
        expect(screen.getByLabelText('Trophy for high level')).toHaveTextContent('🏆');
    });

    it('animates progress bar correctly', () => {
        render(<LevelProgress {...defaultProps} />);

        const progressBar = screen.getByTestId('progress-bar-animation');
        expect(progressBar).toHaveStyle({ width: '75%' });
        expect(progressBar).toHaveClass('bg-blue-600', 'rounded-full');
    });

    it('handles edge cases (0% and 100%)', () => {
        // Test 0%
        const { rerender } = render(
            <LevelProgress {...defaultProps} progress={0} />
        );
        expect(screen.getByText('0% to Level 6')).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');

        // Test 100%
        rerender(<LevelProgress {...defaultProps} progress={1} />);
        expect(screen.getByText('100% to Level 6')).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    });

    it('calculates remaining points accurately', () => {
        render(<LevelProgress {...defaultProps} />);

        // With 75% progress on 1000 threshold, 250 points remain
        expect(screen.getByText('250 points to next level')).toBeInTheDocument();
        expect(screen.getByLabelText('250 points needed for next level')).toBeInTheDocument();
    });

    describe('accessibility', () => {
        it('provides proper ARIA attributes for progress bar', () => {
            render(<LevelProgress {...defaultProps} />);

            const progressBar = screen.getByRole('progressbar');
            expect(progressBar).toHaveAttribute('aria-valuenow', '75');
            expect(progressBar).toHaveAttribute('aria-valuemin', '0');
            expect(progressBar).toHaveAttribute('aria-valuemax', '100');
        });

        it('includes descriptive labels for screen readers', () => {
            render(<LevelProgress {...defaultProps} />);

            expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Level Progress');
            expect(screen.getByLabelText('Progress to next level: 75%')).toBeInTheDocument();
            expect(screen.getByLabelText('250 points needed for next level')).toBeInTheDocument();
        });

        it('maintains proper heading hierarchy', () => {
            render(<LevelProgress {...defaultProps} />);

            const heading = screen.getByText('Level 5');
            expect(heading.tagName).toBe('H3');
            expect(heading).toHaveClass('text-lg', 'font-bold');
        });
    });

    describe('visual presentation', () => {
        it('applies consistent spacing and layout', () => {
            const { container } = render(<LevelProgress {...defaultProps} />);

            const card = container.firstChild as HTMLElement;
            expect(card).toHaveClass('p-6', 'rounded-lg', 'shadow-sm');
        });

        it('maintains proper text hierarchy', () => {
            render(<LevelProgress {...defaultProps} />);

            const levelText = screen.getByText('Level 5');
            const progressText = screen.getByText('75% to Level 6');

            expect(levelText).toHaveClass('text-lg', 'font-bold');
            expect(progressText).toHaveClass('text-sm', 'text-gray-500');
        });

        it('applies proper progress bar styling', () => {
            render(<LevelProgress {...defaultProps} />);

            const progressContainer = screen.getByRole('progressbar');
            expect(progressContainer).toHaveClass('bg-gray-200', 'rounded-full', 'overflow-hidden');
        });
    });

    describe('edge cases', () => {
        it('handles decimal progress values', () => {
            render(<LevelProgress {...defaultProps} progress={0.7777} />);
            expect(screen.getByText('78% to Level 6')).toBeInTheDocument(); // Should round to nearest integer
        });

        it('handles very small progress values', () => {
            render(<LevelProgress {...defaultProps} progress={0.001} />);
            expect(screen.getByText('0% to Level 6')).toBeInTheDocument();
        });

        it('handles very large level numbers', () => {
            render(<LevelProgress {...defaultProps} level={9999} />);
            expect(screen.getByText('Level 9999')).toBeInTheDocument();
            expect(screen.getByText('75% to Level 10000')).toBeInTheDocument();
        });

        it('handles very large threshold values', () => {
            render(<LevelProgress {...defaultProps} nextThreshold={1000000} />);
            expect(screen.getByText('250000 points to next level')).toBeInTheDocument();
        });
    });

    describe('animation behavior', () => {
        it('sets up animation with correct initial state', () => {
            render(<LevelProgress {...defaultProps} />);

            const animation = screen.getByTestId('progress-bar-animation');
            expect(animation).toHaveAttribute('initial', expect.stringContaining('width'));
            expect(animation).toHaveAttribute('animate', expect.stringContaining('width'));
        });

        it('applies smooth transition effect', () => {
            render(<LevelProgress {...defaultProps} />);

            const animation = screen.getByTestId('progress-bar-animation');
            expect(animation).toHaveAttribute('transition', expect.stringContaining('duration'));
            expect(animation).toHaveAttribute('transition', expect.stringContaining('easeOut'));
        });
    });
});
