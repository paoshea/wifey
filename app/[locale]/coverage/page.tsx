import { CoverageFinder } from 'components/coverage/coverage-finder';
import { WiFiFinder } from 'components/wifi/wifi-finder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/ui/tabs';

export default function CoveragePage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coverage Finder</h1>
          <p className="text-muted-foreground mt-2">
            Find and measure network coverage and WiFi hotspots in your area
          </p>
        </div>

        <Tabs defaultValue="coverage" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="coverage">Cellular Coverage</TabsTrigger>
            <TabsTrigger value="wifi">WiFi Points</TabsTrigger>
          </TabsList>

          <TabsContent value="coverage" className="space-y-4">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <h3 className="font-semibold leading-none tracking-tight">
                  Cellular Coverage
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Find and navigate to the nearest cellular coverage point
                </p>
              </div>
              <CoverageFinder className="px-6 pb-6" />
            </div>
          </TabsContent>

          <TabsContent value="wifi" className="space-y-4">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
              <div className="p-6">
                <h3 className="font-semibold leading-none tracking-tight">
                  WiFi Scanner
                </h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Scan and measure WiFi networks in your vicinity
                </p>
              </div>
              <WiFiFinder className="px-6 pb-6" />
            </div>
          </TabsContent>
        </Tabs>

        {/* Quick Tips */}
        <div className="rounded-lg border bg-muted p-6">
          <h3 className="font-semibold mb-3">Quick Tips</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Use cellular coverage finder when you&apos;re in a low signal area
            </li>
            <li className="flex items-center">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
              WiFi scanner works best when you&apos;re stationary
            </li>
            <li className="flex items-center">
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Measurements are saved automatically when offline
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
