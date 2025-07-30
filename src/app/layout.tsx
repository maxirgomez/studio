import type {Metadata} from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/theme-provider';
import { SessionGuard } from "@/components/session-guard";
import { UserProvider } from "@/context/UserContext";
import SpinnerProvider from "@/components/ui/SpinnerProvider";
import SpinnerOverlay from "@/components/ui/SpinnerOverlay";
import NavigationSpinnerHandler from "@/components/ui/NavigationSpinnerHandler";
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Baigun Realty',
  description: 'Manage your real estate listings with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <UserProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            <SpinnerProvider>
              <NavigationSpinnerHandler />
              <SessionGuard />
              <SpinnerOverlay />
              {children}
              <Toaster />
              <Analytics />
            </SpinnerProvider>
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
