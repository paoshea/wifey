# Wifey - Network Coverage & WiFi Measurement Platform

![Wifey Logo](https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/signal.svg)

A sophisticated web application that helps users measure and map cellular coverage and WiFi hotspots. Built for travelers, remote workers, and network enthusiasts who want to contribute to a comprehensive network coverage database.

## Quick Links

- [User Guide](#user-guide)
- [Gamification System](#gamification-system)
- [API Documentation](docs/api/README.md)
- [Component Documentation](docs/components/README.md)
- [Deployment Guide](docs/deployment/README.md)
- [Mobile Implementation](docs/MOBILE_IMPLEMENTATION.md)

## User Guide

### Getting Started
1. Create an account using Google, GitHub, or email
2. Complete your profile and set notification preferences
3. Download the PWA to your device
4. Start measuring network coverage in your area!

### Making Measurements
1. **Coverage Measurements**
   - Open the app in any location
   - Select your carrier (Kolbi, Movistar, Claro, Liberty)
   - Start a measurement session
   - Walk or drive around to collect data
   - Submit your measurements

2. **WiFi Hotspot Mapping**
   - Discover nearby WiFi networks
   - Measure signal strength
   - Record network details
   - Add notes and verification
   - Submit to the database

3. **Verification Process**
   - Measurements are validated automatically
   - Community members can verify hotspots
   - Quality scores increase with verification
   - Verified spots earn bonus points

### User Journey
1. **Newcomer** (Level 1-5)
   - Learn basic measurement techniques
   - Complete onboarding achievements
   - Start your first streak
   - Join the community

2. **Regular Contributor** (Level 6-15)
   - Maintain daily measurement streaks
   - Unlock advanced features
   - Start verifying others' measurements
   - Compete on leaderboards

3. **Expert Mapper** (Level 16-30)
   - Access premium features
   - Earn special badges
   - Mentor new users
   - Join special events

4. **Master Surveyor** (Level 31+)
   - Create community challenges
   - Lead special events
   - Access exclusive rewards
   - Shape platform features

## Gamification System

### Points System
1. **Basic Measurements**
   - Coverage measurement: 10 points
   - WiFi hotspot discovery: 15 points
   - Verified measurement: +5 points
   - First in area bonus: +20 points

2. **Quality Bonuses**
   - Accuracy bonus: +1-5 points
   - Consistency bonus: +2-8 points
   - Detail bonus: +3-10 points
   - Rural area bonus: +25 points

3. **Streaks**
   - Daily streak bonus: ×1.1 multiplier
   - Weekly streak: ×1.25 multiplier
   - Monthly streak: ×1.5 multiplier
   - Special event multipliers: up to ×3

### Achievements
1. **Measurement Milestones**
   - First Steps (10 measurements)
   - Regular Contributor (100 measurements)
   - Coverage Expert (1,000 measurements)
   - Master Surveyor (10,000 measurements)

2. **Quality Achievements**
   - Precision Master (high accuracy)
   - Rural Explorer (rural measurements)
   - Network Sage (all carriers)
   - Community Pillar (verifications)

3. **Special Achievements**
   - Event Champion
   - Area Pioneer
   - Streak Master
   - Community Leader

### Levels and Progression
1. **Experience Points (XP)**
   - Points convert to XP
   - Bonus XP from achievements
   - Special event XP
   - Community contribution XP

2. **Level Benefits**
   - New features unlocked
   - Increased point multipliers
   - Special badges
   - Community privileges

3. **Ranks**
   - Bronze (Level 1-10)
   - Silver (Level 11-20)
   - Gold (Level 21-30)
   - Platinum (Level 31+)

## Features

### Coverage Features
- Interactive coverage map with real-time measurements
- Multi-carrier support (Kolbi, Movistar, Claro, Liberty)
- Signal strength visualization and heatmaps
- Coverage quality metrics and analytics
- Rural area coverage tracking
- Offline measurement collection
- Background sync capabilities
- Measurement validation system

### WiFi Features
- WiFi hotspot mapping and discovery
- Signal strength measurements
- Security protocol detection
- Speed test integration
- Detailed network information
- Community verification system
- Historical performance tracking
- Connection quality metrics

### User Features
- Multi-provider authentication
- Detailed user profiles
- Achievement tracking
- Contribution analytics
- Personal statistics dashboard
- Community rankings
- Social interactions
- Smart notifications
- Email digests

### Technical Features
- Progressive Web App (PWA)
- Offline-first architecture
- OpenTelemetry integration
- Performance monitoring
- Error tracking with Sentry
- Analytics integration
- Comprehensive type safety
- Mobile optimization
- i18n support

### Mobile Features
- Native iOS and Android support
- Responsive design system
- Cross-platform compatibility
- Platform-specific optimizations
- Safe area handling
- Offline capabilities
- Background location tracking
- Push notifications
- Deep linking support
- Touch-optimized UI
- Gesture controls
- Haptic feedback

## Tech Stack

### Frontend
- Next.js 14.0.3
- React 18.2.0
- TypeScript 5.2.2
- Tailwind CSS 3.3.5
- Framer Motion 10.16.4
- Leaflet Maps
- PWA capabilities
- next-intl

### Mobile
- React Native (planned)
- Native iOS components
- Native Android components
- Shared TypeScript codebase
- Platform-specific optimizations
- Mobile-first responsive design

### Backend
- MongoDB with Prisma ORM
- NextAuth.js authentication
- API routes with rate limiting
- WebSocket support
- Background jobs
- Redis caching (optional)
- Email integration

### Monitoring & Analytics
- OpenTelemetry instrumentation
- Sentry error tracking
- Performance monitoring
- User behavior analytics
- Error reporting
- Usage statistics
- Custom metrics

### Development Tools
- ESLint with custom rules
- TypeScript strict mode
- Jest for unit testing
- Playwright for E2E tests
- GitHub Actions CI/CD
- Docker containerization
- Webpack optimization

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/wifey.git
cd wifey
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create .env.local from example
cp .env.example .env.local
```

Required environment variables:
```env
# Database
MONGODB_URI=your-mongodb-uri

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email
RESEND_API_KEY=your-resend-api-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_VERBOSE=true # For detailed logging
```

4. Initialize database:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

5. Start development server:
```bash
npm run dev
```

## Development

### Code Structure
```
wifey/
├── app/              # Next.js app directory
│   ├── api/         # API routes
│   ├── auth/        # Authentication
│   └── [locale]/    # Localized routes
├── components/      # React components
├── lib/            # Core libraries
│   ├── services/   # Business logic
│   ├── types/      # TypeScript types
│   └── utils/      # Utilities
├── mobile/         # Mobile implementation
│   ├── android/    # Android-specific code
│   ├── ios/        # iOS-specific code
│   └── shared/     # Shared mobile code
├── prisma/         # Database schema
├── public/         # Static assets
├── styles/        # Global styles
├── docs/          # Documentation
└── tests/         # Test files
```

### Key Services
- MeasurementService
- GamificationService
- LeaderboardService
- NotificationService
- CacheService
- MonitoringService

### Testing

Run tests:
```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## Deployment

See [Deployment Guide](docs/deployment/README.md) for detailed instructions.

Quick deploy:
```bash
# Build
npm run build

# Start production server
npm start
```

## Next Steps

### Immediate Priorities
1. **React Native Implementation**
   - Convert current mobile web implementation to React Native
   - Implement platform-specific features
   - Optimize performance for native platforms
   - Add native gesture support

2. **Enhanced Offline Support**
   - Improve offline data synchronization
   - Add conflict resolution
   - Implement background sync
   - Enhance offline maps

3. **Advanced Location Features**
   - Implement geofencing
   - Add route tracking
   - Enhance location accuracy
   - Add location predictions

4. **Performance Optimizations**
   - Implement lazy loading
   - Add image optimization
   - Enhance caching strategies
   - Optimize bundle size

### Future Enhancements

1. **Advanced Features**
   - AR coverage visualization
   - Machine learning predictions
   - Advanced analytics dashboard
   - Real-time collaboration
   - Social features
   - Community challenges

2. **Platform Expansion**
   - Desktop application
   - Smart watch support
   - Tablet optimization
   - Car integration
   - IoT device support

3. **Technical Improvements**
   - GraphQL implementation
   - WebAssembly optimizations
   - Edge computing support
   - Enhanced security features
   - Advanced caching strategies

4. **Community Features**
   - User groups
   - Team challenges
   - Expert verification system
   - Community forums
   - Knowledge base

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

See [Contributing Guide](CONTRIBUTING.md) for details.

## Team

### Leadership
**Phil O'Shea FCA**
- Project Lead & Software Architect
- Vision and Strategy Lead
- [LinkedIn](https://linkedin.com/in/philipaoshea)

### Development Team
- Frontend Engineers
  - UI/UX Specialists
  - PWA Experts
  - Performance Optimizers
- Backend Developers
  - Database Architects
  - API Developers
  - Security Specialists
- UX/UI Designers
  - User Research
  - Interface Design
  - Interaction Design
- QA Engineers
  - Test Automation
  - Performance Testing
  - Security Testing
- Mobile Developers
  - iOS Specialists
  - Android Specialists
  - Cross-platform Experts

### Community Team
- Community Managers
- Content Writers
- Support Specialists
- Data Analysts

## Support

- Documentation: [docs.wifey.app](https://docs.wifey.app)
- Issues: [GitHub Issues](https://github.com/your-username/wifey/issues)
- Email: support@wifey.app

## Acknowledgments

### Technology Partners
- OpenStreetMap for mapping data
- Leaflet for interactive maps
- Vercel for hosting and deployment
- MongoDB Atlas for database hosting
- Sentry for error tracking
- OpenTelemetry for monitoring

### Open Source Community
- Next.js team for the amazing framework
- Prisma team for the ORM
- TailwindCSS team for styling
- Jest and Playwright teams for testing tools
- GitHub team for collaboration tools

### Special Thanks
- Early adopters and beta testers
- Community contributors
- Network carrier partners
- Academic research partners

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ by the Wifey Team
