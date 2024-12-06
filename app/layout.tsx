import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wifey App',
  description: 'Coverage and connectivity app',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
