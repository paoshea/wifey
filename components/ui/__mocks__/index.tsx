import React from 'react';

// Basic UI component mocks
export const Button = ({ children, ...props }: any) => (
    <button data-testid="mock-button" {...props}>
        {children}
    </button>
);

export const Card = ({ children, ...props }: any) => (
    <div data-testid="mock-card" {...props}>
        {children}
    </div>
);

export const Progress = ({ value, max = 100, ...props }: any) => (
    <div data-testid="mock-progress" data-value={value} data-max={max} {...props} />
);

export const Avatar = ({ src, alt, ...props }: any) => (
    <div data-testid="mock-avatar" data-src={src} data-alt={alt} {...props} />
);

export const Badge = ({ children, ...props }: any) => (
    <span data-testid="mock-badge" {...props}>
        {children}
    </span>
);

export const Label = ({ children, ...props }: any) => (
    <label data-testid="mock-label" {...props}>
        {children}
    </label>
);

export const Input = ({ ...props }: any) => (
    <input data-testid="mock-input" {...props} />
);

export const Select = ({ children, ...props }: any) => (
    <select data-testid="mock-select" {...props}>
        {children}
    </select>
);

export const Tooltip = ({ content, children, ...props }: any) => (
    <div data-testid="mock-tooltip" data-content={content} {...props}>
        {children}
    </div>
);

export const Dialog = ({ children, ...props }: any) => (
    <div data-testid="mock-dialog" {...props}>
        {children}
    </div>
);

export const Alert = ({ children, ...props }: any) => (
    <div data-testid="mock-alert" {...props}>
        {children}
    </div>
);

export const Toast = ({ children, ...props }: any) => (
    <div data-testid="mock-toast" {...props}>
        {children}
    </div>
);

// Icons mock
export const Icons = {
    ChevronRight: () => <span data-testid="mock-icon-chevron-right">→</span>,
    ChevronLeft: () => <span data-testid="mock-icon-chevron-left">←</span>,
    Check: () => <span data-testid="mock-icon-check">✓</span>,
    X: () => <span data-testid="mock-icon-x">✕</span>,
    Star: () => <span data-testid="mock-icon-star">⭐</span>,
    Trophy: () => <span data-testid="mock-icon-trophy">🏆</span>,
    Map: () => <span data-testid="mock-icon-map">🗺️</span>,
    Signal: () => <span data-testid="mock-icon-signal">📶</span>,
    Wifi: () => <span data-testid="mock-icon-wifi">📡</span>,
    User: () => <span data-testid="mock-icon-user">👤</span>,
    Settings: () => <span data-testid="mock-icon-settings">⚙️</span>,
    Bell: () => <span data-testid="mock-icon-bell">🔔</span>,
    Crown: () => <span data-testid="mock-icon-crown">👑</span>,
    Medal: () => <span data-testid="mock-icon-medal">🏅</span>,
    Target: () => <span data-testid="mock-icon-target">🎯</span>,
    Pin: () => <span data-testid="mock-icon-pin">📍</span>,
    Tree: () => <span data-testid="mock-icon-tree">🌲</span>,
    Chart: () => <span data-testid="mock-icon-chart">📊</span>,
    Loading: () => <span data-testid="mock-icon-loading">⌛</span>
};
