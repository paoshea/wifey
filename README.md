# Wifey - Coverage & WiFi Finder

![Wifey Logo](https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/signal.svg)

A sophisticated web application that helps users find cellular coverage points and free WiFi hotspots. Perfect for travelers, remote workers, and anyone who needs to stay connected.

## Documentation

- [API Documentation](docs/api/README.md)
- [Component Documentation](docs/components/README.md)
- [Deployment Guide](docs/deployment/README.md)

## Features

### Coverage Features
- Interactive coverage map
- Real-time location tracking
- Turn-by-turn navigation
- Multi-carrier support
- Coverage strength visualization
- Intelligent route optimization
- X marks spot functionality
- Offline support
- Background sync

### WiFi Features
- WiFi hotspot mapping
- Real-time availability
- Detailed hotspot info
- Distance estimation
- Navigation support
- Favorite locations
- Community verification
- Speed ratings

### Gamification System
- Points and rewards
- Daily streaks
- Achievement badges
- Level progression
- Leaderboards
- Community challenges
- Special events
- Progress tracking

### User Features
- Authentication system
- User profiles
- Achievement tracking
- Contribution history
- Personal statistics
- Community rankings
- Social features
- Notifications

### Technical Features
- Progressive Web App
- Offline functionality
- Push notifications
- Performance monitoring
- Error tracking
- Analytics integration
- API documentation
- Mobile optimization

## Tech Stack

### Frontend
- Next.js 14.0.3
- React 18.2.0
- TypeScript 5.2.2
- Tailwind CSS 3.3.5
- Framer Motion 10.16.4
- Leaflet Maps
- PWA support

### Backend
- MongoDB
- Prisma ORM
- NextAuth.js
- API routes
- WebSocket support
- Background jobs

### Monitoring
- Sentry error tracking
- PostHog analytics
- Performance monitoring
- User behavior tracking
- Error reporting
- Usage statistics

### Development Tools
- ESLint
- TypeScript
- Jest testing
- Playwright E2E
- GitHub Actions
- Docker support

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- npm or yarn
- Git

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/your-username/wifey.git
cd wifey
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`env
# Create .env.local from example
cp .env.example .env.local
\`\`\`

4. Initialize database:
\`\`\`bash
npx prisma db push
\`\`\`

5. Start development server:
\`\`\`bash
npm run dev
\`\`\`

## Development

### Code Structure
\`\`\`
wifey/
├── app/                 # Next.js app directory
├── components/         # React components
├── lib/               # Utilities and services
├── public/            # Static assets
├── styles/           # Global styles
├── docs/             # Documentation
└── tests/            # Test files
\`\`\`

### Key Components
- Coverage Map
- Location Finder
- Leaderboard
- Achievement System
- User Dashboard
- Error Handling

### Testing

Run tests:
\`\`\`bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
\`\`\`

## Deployment

See [Deployment Guide](docs/deployment/README.md) for detailed instructions.

Quick deploy:
\`\`\`bash
# Build
npm run build

# Start production server
npm start
\`\`\`

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

See [Contributing Guide](CONTRIBUTING.md) for details.

## Support

- Documentation: [docs.wifey.app](https://docs.wifey.app)
- Issues: [GitHub Issues](https://github.com/your-username/wifey/issues)
- Email: support@wifey.app

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

## Team

### Leadership
**Phil O'Shea FCA**
- Project Lead & Software Architect
- Vision and Strategy Lead
- [LinkedIn](https://linkedin.com/in/philipaoshea)

### Development Team
- Frontend Engineers
- Backend Developers
- UX/UI Designers
- QA Engineers

## Acknowledgments
- OpenStreetMap
- Leaflet
- Next.js team
- Open source community

---

Made with ❤️ by the Wifey Team
