'use client';

export default function WifiFinderPage() {
  return (
    <div className="min-h-screen pt-24 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80 mb-6">
          WiFi Finder
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Find and connect to WiFi hotspots in your area.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl bg-card hover:bg-card/80 transition-colors border border-border">
            <h2 className="text-xl font-semibold mb-3">Nearby Hotspots</h2>
            <p className="text-muted-foreground">
              Searching for WiFi networks in your vicinity...
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-card hover:bg-card/80 transition-colors border border-border">
            <h2 className="text-xl font-semibold mb-3">Connection Details</h2>
            <p className="text-muted-foreground">
              Select a network to view connection details and signal strength.
            </p>
          </div>
        </div>
        <div className="mt-8 p-6 rounded-2xl bg-card hover:bg-card/80 transition-colors border border-border">
          <h2 className="text-xl font-semibold mb-3">Network Map</h2>
          <p className="text-muted-foreground">
            View WiFi hotspots on an interactive map to find the closest connection point.
          </p>
        </div>
      </div>
    </div>
  );
}
