import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { EnhancedRootLayout } from "@/components/layout/EnhancedRootLayout";
import { AuthProvider } from "@/contexts/AuthContext";
import "@/styles/globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "DefenDDoS - Security Command Center",
  description: "Real-time DDoS protection and threat monitoring system with ML-powered detection",
  keywords: ["DDoS", "security", "threat detection", "network monitoring", "cybersecurity"],
  authors: [{ name: "DefenDDoS Team" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0ea5e9" },
    { media: "(prefers-color-scheme: dark)", color: "#0284c7" }
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        <AuthProvider>
          <EnhancedRootLayout>
            {children}
          </EnhancedRootLayout>
        </AuthProvider>
      </body>
    </html>
  );
}

