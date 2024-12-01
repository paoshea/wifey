export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex-col">
      <div className="flex min-h-screen flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
