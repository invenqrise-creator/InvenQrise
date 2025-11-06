import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/hooks/use-auth";
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';

export const metadata: Metadata = {
  title: 'InvenQrise',
  description: 'Smart Inventory Management',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;500;700&family=Belleza&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#166534" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
              {children}
              <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
