// Prevent static generation for this route
export const dynamic = 'force-dynamic';

export default function CoverageFinderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
