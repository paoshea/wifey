export const brandConfig = {
    name: 'Wifey',
    description: 'Community-driven WiFi and cellular coverage mapping',
    logo: {
        text: 'Wifey',
        icon: '📡',
        fullIcon: '📡 Wifey'
    },
    colors: {
        primary: {
            '50': '#f0f9ff',
            '100': '#e0f2fe',
            '200': '#bae6fd',
            '300': '#7dd3fc',
            '400': '#38bdf8',
            '500': '#0ea5e9',
            '600': '#0284c7',
            '700': '#0369a1',
            '800': '#075985',
            '900': '#0c4a6e',
            '950': '#082f49'
        },
        secondary: {
            '50': '#f5f3ff',
            '100': '#ede9fe',
            '200': '#ddd6fe',
            '300': '#c4b5fd',
            '400': '#a78bfa',
            '500': '#8b5cf6',
            '600': '#7c3aed',
            '700': '#6d28d9',
            '800': '#5b21b6',
            '900': '#4c1d95',
            '950': '#2e1065'
        }
    },
    theme: {
        light: {
            background: '#ffffff',
            foreground: '#000000',
            primary: '#0ea5e9',
            secondary: '#8b5cf6'
        },
        dark: {
            background: '#000000',
            foreground: '#ffffff',
            primary: '#38bdf8',
            secondary: '#a78bfa'
        }
    },
    features: {
        wifi: {
            enabled: true,
            icon: '📡',
            title: 'WiFi Coverage',
            description: 'Map and discover WiFi coverage in your area'
        },
        cellular: {
            enabled: true,
            icon: '📱',
            title: 'Cellular Coverage',
            description: 'Track cellular signal strength and quality'
        },
        gamification: {
            enabled: true,
            icon: '🎮',
            title: 'Gamification',
            description: 'Earn points and compete on the leaderboard'
        },
        offline: {
            enabled: true,
            icon: '🔌',
            title: 'Offline Support',
            description: 'Continue mapping even without internet connection'
        }
    },
    social: {
        github: 'https://github.com/yourusername/wifey',
        twitter: 'https://twitter.com/wifeyapp',
        discord: 'https://discord.gg/wifey'
    },
    contact: {
        email: 'support@wifey.app',
        website: 'https://wifey.app'
    }
} as const;

export const getBrandConfig = () => brandConfig;
