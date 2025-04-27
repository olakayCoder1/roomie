import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { NavigationBar } from '@/components/navigation-bar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Roomie - Find Your Perfect Match',
  description: 'Find roommates and places to stay with our TikTok-style discovery platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <main className="flex-1 pt-2 pb-16 md:pt-0">
              {children}
            </main>
            <NavigationBar />
          </div>
        </Providers>
      </body>
    </html>
  );
}