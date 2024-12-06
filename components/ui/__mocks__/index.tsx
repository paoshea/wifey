import React from 'react';

interface CommonProps {
    children?: React.ReactNode;
    className?: string;
}

interface AvatarProps extends CommonProps {
    src?: string;
    alt?: string;
}

interface ButtonProps extends CommonProps {
    variant?: string;
    disabled?: boolean;
    onClick?: () => void;
}

interface BadgeProps extends CommonProps {
    variant?: string;
}

interface CardProps extends CommonProps {
    variant?: string;
}

interface ProgressProps extends Omit<CommonProps, 'children'> {
    value?: number;
    max?: number;
}

interface TooltipProps extends CommonProps {
    content: React.ReactNode;
}

export const Avatar: React.FC<AvatarProps> = ({ children, ...props }) => (
    <div data-testid="mock-avatar" {...props}>
        {children}
    </div>
);

export const Button: React.FC<ButtonProps> = ({ children, ...props }) => (
    <button data-testid="mock-button" {...props}>
        {children}
    </button>
);

export const Badge: React.FC<BadgeProps> = ({ children, ...props }) => (
    <span data-testid="mock-badge" {...props}>
        {children}
    </span>
);

export const Card: React.FC<CardProps> = ({ children, ...props }) => (
    <div data-testid="mock-card" {...props}>
        {children}
    </div>
);

export const Progress: React.FC<ProgressProps> = ({ value, ...props }) => (
    <div data-testid="mock-progress" data-value={value} {...props} />
);

export const Tooltip: React.FC<TooltipProps> = ({ children, content, ...props }) => (
    <div data-testid="mock-tooltip" data-content={content} {...props}>
        {children}
    </div>
);

// Mock icons
export const Icons = {
    ChevronRight: () => (
        <span data-testid="mock-icon-chevron-right">→</span>
    ),
    ChevronLeft: () => (
        <span data-testid="mock-icon-chevron-left">←</span>
    ),
    Check: () => (
        <span data-testid="mock-icon-check">✓</span>
    ),
    X: () => (
        <span data-testid="mock-icon-x">✕</span>
    ),
    Star: () => (
        <span data-testid="mock-icon-star">⭐</span>
    ),
    Trophy: () => (
        <span data-testid="mock-icon-trophy">🏆</span>
    ),
    Map: () => (
        <span data-testid="mock-icon-map">🗺️</span>
    ),
    Signal: () => (
        <span data-testid="mock-icon-signal">📶</span>
    ),
    Wifi: () => (
        <span data-testid="mock-icon-wifi">📡</span>
    ),
    User: () => (
        <span data-testid="mock-icon-user">👤</span>
    ),
    Settings: () => (
        <span data-testid="mock-icon-settings">⚙️</span>
    ),
    Bell: () => (
        <span data-testid="mock-icon-bell">🔔</span>
    ),
    Crown: () => (
        <span data-testid="mock-icon-crown">👑</span>
    ),
    Medal: () => (
        <span data-testid="mock-icon-medal">🏅</span>
    ),
    Target: () => (
        <span data-testid="mock-icon-target">🎯</span>
    ),
    Pin: () => (
        <span data-testid="mock-icon-pin">📍</span>
    ),
    Tree: () => (
        <span data-testid="mock-icon-tree">🌲</span>
    ),
    Chart: () => (
        <span data-testid="mock-icon-chart">📊</span>
    ),
    Loading: () => (
        <span data-testid="mock-icon-loading">⌛</span>
    )
} as const;
