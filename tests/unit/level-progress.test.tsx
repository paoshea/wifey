import React from 'react';
import { render, screen } from '@testing-library/react';
import { LevelProgress } from '@components/gamification/level-progress';

describe('LevelProgress', () => {
    const defaultProps = {
        level: 5,
        progress: 0.75, // 75%
        nextThreshold: 1000,
    };

    it('calculates percentage correctly', () => {
        render(<LevelProgress {...defaultProps} />);

        expect(screen.getByText('75% to Level 6')).toBeInTheDocument();
        expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
    });

    it('displays appropriate icon based on level', () => {
        // Test low level (star)
        const { rerender } = render(<LevelProgress {...defaultProps} />);
        expect(screen.getByRole('img', { name: 'Star for current level' })).toHaveTextContent('⭐️');

        // Test high level (trophy)
        rerender(<LevelProgress {...defaultProps} level={15} />);
        expect(screen.getByRole('img', { name: 'Trophy for high level' })).toHaveTextContent('🏆');
    });

    it('animates progress bar correctly', () => {
        render(<LevelProgress {...defaultProps} />);

        const progressBar = screen.getByTestId('progress-bar-animation');
        expect(progressBar).toHaveAttribute('animate', JSON.stringify({ width: '75%' }));
        expect(progressBar).toHaveAttribute('initial', JSON.stringify({ width: 0 }));
    });

    it('handles edge cases for progress', () => {
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
        // With progress 0.75 and nextThreshold 1000, remaining points should be 250
        expect(screen.getByText('250 points to next level')).toBeInTheDocument();
    });

    it('maintains accessibility with proper ARIA labels', () => {
        render(<LevelProgress {...defaultProps} />);

        // Check region label
        expect(screen.getByRole('region')).toHaveAccessibleName('Level Progress');

        // Check progress text
        expect(screen.getByText('75% to Level 6')).toHaveAccessibleDescription('Progress to next level: 75%');

        // Check progressbar
        const progressbar = screen.getByRole('progressbar');
        expect(progressbar).toHaveAttribute('aria-valuemin', '0');
        expect(progressbar).toHaveAttribute('aria-valuemax', '100');
        expect(progressbar).toHaveAttribute('aria-valuenow', '75');

        // Check remaining points text
        expect(screen.getByText('250 points to next level')).toHaveAccessibleName('250 points needed for next level');
    });

    it('handles decimal progress values correctly', () => {
        render(<LevelProgress {...defaultProps} progress={0.7777} />);
        expect(screen.getByText('78% to Level 6')).toBeInTheDocument(); // Should round to nearest integer
    });

    it('handles very small progress values', () => {
        render(<LevelProgress {...defaultProps} progress={0.001} />);
        expect(screen.getByText('0% to Level 6')).toBeInTheDocument();
        expect(screen.getByText('999 points to next level')).toBeInTheDocument();
    });

    it('handles very large threshold values', () => {
        render(<LevelProgress {...defaultProps} nextThreshold={1000000} />);
        // With 75% progress, remaining points should be 250000
        expect(screen.getByText('250000 points to next level')).toBeInTheDocument();
    });

    it('maintains proper heading hierarchy', () => {
        render(<LevelProgress {...defaultProps} />);

        const heading = screen.getByText('Level 5');
        expect(heading.tagName).toBe('H3');
        expect(heading).toHaveClass('text-lg', 'font-bold');
    });

    it('applies consistent layout and spacing', () => {
        const { container } = render(<LevelProgress {...defaultProps} />);
        const mainDiv = container.firstChild as HTMLElement;

        expect(mainDiv).toHaveClass('bg-white', 'p-6', 'rounded-lg', 'shadow-sm');
        expect(mainDiv.querySelector('.mb-4')).toBeInTheDocument(); // Check spacing between elements
    });

    it('handles progress bar animation transition', () => {
        render(<LevelProgress {...defaultProps} />);

        const progressBar = screen.getByTestId('progress-bar-animation');
        expect(progressBar).toHaveAttribute(
            'transition',
            JSON.stringify({ duration: 1, ease: 'easeOut' })
        );
    });
});
