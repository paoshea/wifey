'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function LocalePage() {
  const { locale } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-sm border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href={`/${locale}`} className="text-xl font-bold text-foreground hover:text-primary transition-colors">
                Wifey
              </Link>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <Link href={`/${locale}/wifi-finder`} className="text-muted-foreground hover:text-foreground transition-colors">
                WiFi Finder
              </Link>
              <Link href={`/${locale}/coverage-finder`} className="text-muted-foreground hover:text-foreground transition-colors">
                Coverage
              </Link>
              <Link href={`/${locale}/map`} className="text-muted-foreground hover:text-foreground transition-colors">
                Map
              </Link>
              <Link href={`/${locale}/leaderboard`} className="text-muted-foreground hover:text-foreground transition-colors">
                Leaderboard
              </Link>
              <Link
                href={`/${locale}/auth/signin`}
                className="ml-4 px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="pt-24 pb-16 px-4 sm:pt-32 sm:pb-24">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80 mb-6">
            Map Your Network Experience
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Join our community in mapping WiFi and cellular coverage. Help others find the best connectivity while earning points and rewards.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}/wifi-finder`}
              className="px-8 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all transform hover:scale-105 shadow-lg hover:shadow-primary/20"
            >
              Find WiFi
            </Link>
            <Link
              href={`/${locale}/coverage-finder`}
              className="px-8 py-3 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all transform hover:scale-105 shadow-lg hover:shadow-secondary/20"
            >
              Check Coverage
            </Link>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="group p-6 rounded-2xl bg-card hover:bg-card/80 transition-colors border border-border hover:border-primary/20 shadow-lg hover:shadow-xl">
            <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
              Map Coverage
            </h3>
            <p className="text-muted-foreground">
              Contribute to our crowdsourced map of WiFi and cellular coverage
            </p>
          </div>

          <div className="group p-6 rounded-2xl bg-card hover:bg-card/80 transition-colors border border-border hover:border-primary/20 shadow-lg hover:shadow-xl">
            <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
              Earn Points
            </h3>
            <p className="text-muted-foreground">
              Get rewarded for helping map network coverage in your area
            </p>
          </div>

          <div className="group p-6 rounded-2xl bg-card hover:bg-card/80 transition-colors border border-border hover:border-primary/20 shadow-lg hover:shadow-xl">
            <h3 className="text-xl font-semibold mb-3 text-foreground group-hover:text-primary transition-colors">
              Find Networks
            </h3>
            <p className="text-muted-foreground">
              Discover the best WiFi and cellular coverage wherever you go
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
