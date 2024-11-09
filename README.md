# Wifey - Coverage & WiFi Finder

![Wifey Logo](https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/signal.svg)

A sophisticated mobile application that helps users find cellular coverage points and free WiFi hotspots. Perfect for travelers, remote workers, and anyone who needs to stay connected.

## Overview

Wifey helps users in two primary scenarios:
1. Finding the nearest cellular coverage point when in a dead zone
2. Locating free WiFi hotspots in the vicinity

## Current Features

- 🗺️ Interactive coverage maps
- 📱 Real-time cellular coverage detection
- 📍 Turn-by-turn navigation to coverage points
- 🌐 Free WiFi hotspot locator
- 📊 Signal strength visualization
- 🔄 Multi-carrier support (Costa Rica)
- 📡 Network technology detection (2G/3G/4G/5G)
- 🌍 Internationalization (English & Spanish)
- 👤 User registration with language preference
- 🔄 Language switching on any page
- 🎨 Modern, responsive UI with Tailwind CSS
- 🔒 Form validation with Zod
- 📱 Mobile-first design

## Tech Stack

- **Frontend**: Next.js 13, React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Maps**: Leaflet with React integration
- **Database**: MongoDB Atlas
- **API**: RESTful with Next.js API routes
- **Authentication**: NextAuth.js
- **Form Handling**: React Hook Form, Zod
- **Internationalization**: next-intl
- **Icons**: Lucide React
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- MongoDB Atlas account
- Carrier API keys (for production)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/wifey.git

# Install dependencies
cd wifey
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

### Environment Variables

```env
MONGODB_URI=your_mongodb_uri
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=http://localhost:3000

# Carrier API Keys (Costa Rica)
KOLBI_API_KEY=your_kolbi_api_key
MOVISTAR_API_KEY=your_movistar_api_key
CLARO_API_KEY=your_claro_api_key
LIBERTY_API_KEY=your_liberty_api_key
```

## Internationalization

The app supports multiple languages:
- English (default)
- Spanish

Language can be selected:
1. During registration
2. Via language switcher in navigation
3. Through URL prefix (/en/, /es/)

## Roadmap

### Immediate Next Steps

1. **API Integration**
   - Implement real carrier API connections
   - Add error handling and rate limiting
   - Cache frequent requests

2. **Authentication**
   - Complete user registration flow
   - Profile management
   - Coverage history

3. **Data Collection**
   - Crowdsourced coverage data
   - Signal strength reporting
   - Coverage verification system

### Future Enhancements

1. **Coverage Features**
   - Offline maps support
   - Coverage prediction algorithms
   - Historical coverage patterns
   - Signal strength heatmaps

2. **WiFi Features**
   - Speed test integration
   - Security ratings
   - User reviews and ratings
   - Password sharing for authorized spots

3. **Community Features**
   - User-contributed hotspots
   - Coverage reports
   - Reputation system
   - Community verification

4. **Premium Features**
   - Advanced coverage analytics
   - Priority hotspot access
   - Coverage alerts
   - Network speed predictions

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Team

### Leadership

**Phil O'Shea FCA**
- Entrepreneur & Software Architect
- Vision and Strategy Lead
- [LinkedIn](https://linkedin.com/in/philipaoshea)

## Acknowledgments

- OpenStreetMap for map data
- Leaflet for mapping functionality
- shadcn/ui for beautiful UI components
- next-intl for internationalization support
- All contributors and supporters

## Support

For support, please open an issue in the GitHub repository or contact the team at support@wifey.app

---

Made with ❤️ by the Wifey Team