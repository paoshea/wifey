import "./globals.css";
import { Roboto, Roboto_Mono } from "@next/font/google";
import ClientProviders from "../components/ClientProviders";


const roboto = Roboto({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });
const robotoMono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "700"], display: "swap" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${roboto.className} ${robotoMono.className}`}>
      <body>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
