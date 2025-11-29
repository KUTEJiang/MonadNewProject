import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getClientConfig } from "@/lib/config";
import { Providers } from "@/components/providers";
import { WalletConnection } from "@/components/WalletConnection";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const config = getClientConfig();

export const metadata: Metadata = {
  title: config.appName,
  description: config.appDescription,
  keywords: ["NFT", "AI", "Monad", "Web3", "Image Generation", "Blockchain"],
  authors: [{ name: "PromptMint Team" }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}
      >
        <div className="min-h-screen flex flex-col">
          <Providers>
            <header className="bg-white shadow-sm border-b">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <div className="flex items-center space-x-3">
                    <img src="/logo.svg" alt="Logo" className="w-8 h-8" />
                    <h1 className="text-xl font-bold text-gray-900">
                      {config.appName}
                    </h1>
                  </div>
                  <WalletConnection />
                </div>
              </div>
            </header>
            <main className="flex-1">
              {children}
            </main>
          </Providers>
          <footer className="bg-white border-t">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <p className="text-center text-sm text-gray-500">
                {config.appDescription}
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
