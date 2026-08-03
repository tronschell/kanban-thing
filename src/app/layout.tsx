import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import GoogleAnalytics from '@/components/google-analytics'
import { themeBootstrapScript } from '@/lib/themes'
import { baseUrl } from '@/lib/metadata'

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  preload: false,
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    template: '%s | KanbanThing',
    default: 'Free Online Kanban Board — No Sign Up, No Login'
  },
  description: 'Create a shared kanban board online — no login, no registration, no email, no install. Name a board, send the link, drag the cards. Free, and it stays free.',
  metadataBase: new URL(baseUrl),
  openGraph: {
    type: 'website',
    siteName: 'KanbanThing',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full ${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link rel="preconnect" href="https://googleads.g.doubleclick.net" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7416624351466531"
          crossOrigin="anonymous"></script>
        <meta name='admaven-placement' content='Bqja8rds7'></meta>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full overflow-auto`}
      >
        {/* Blocking, and in body because the ad loader prepends into head and would displace it:
            stamps the stored theme before paint, since localStorage is unreachable during SSR. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript() }} />
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics GA_MEASUREMENT_ID={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
        {children}
      </body>
    </html>
  );
}
