import { Metadata } from 'next';
import RangeCoverage from '@/components/coverage/range-coverage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Coverage Map',
  description: 'View and compare cellular coverage in your area',
};

export default function CoveragePage() {
  return (
    <main className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle>Coverage Map</CardTitle>
          <CardDescription>
            View and compare cellular coverage in your area. Adjust the range to see coverage points
            within a specific radius of your location.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RangeCoverage />
        </CardContent>
      </Card>
    </main>
  );
}
