import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: 'FinHealth - Gestao Financeira de Saude',
    template: '%s | FinHealth',
  },
  description: 'Sistema de gestao financeira para operadoras de saude. Controle de contas medicas, glosas, pagamentos e faturamento TISS/SUS.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'FinHealth - Gestao Financeira de Saude',
    description: 'Sistema de gestao financeira para operadoras de saude. Controle de contas medicas, glosas, pagamentos e faturamento TISS/SUS.',
    url: 'https://finhealth.app',
    siteName: 'FinHealth',
    images: [{ url: '/og-image.svg', width: 1200, height: 630, alt: 'FinHealth' }],
    locale: 'pt_BR',
    type: 'website',
  },
  robots: {
    index: false,
    follow: false,
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
