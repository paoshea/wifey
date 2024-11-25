import Image from 'next/image';
import Link from 'next/link';

export function Header() {
  return (
    <header className="w-full flex justify-center items-center py-4">
      <Link href="/" className="flex items-center">
        <Image
          src="/branding/logo.svg"
          alt="Logo"
          width={120}
          height={120}
          priority
        />
      </Link>
    </header>
  );
}
