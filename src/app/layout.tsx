import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import GoogleAnalytics from '@/components/google-analytics'

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
  keywords: ['Kanban', 'Kanban Board', 'Free Kanban Board', 'Programming', 'Project Management', 'Task Management', 'Scrum', 'Agile', 'Workflow', 'Productivity'],
  title: {
    template: '%s | KanbanThing',
    default: 'KanbanThing - Simple Free Kanban Board Tool'
  },
  description: 'A simple, no-signup, and free Kanban board application designed to help individuals and teams organize their work effectively. KanbanThing can be used for project management, team collaboration, or as a simple task list.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://kanbanthing.com'),
  openGraph: {
    type: 'website',
    siteName: 'KanbanThing',
  },
  robots: {
    index: true,
    follow: true,
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
    <html lang="en" className="h-full">
      <head>
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7416624351466531"
          crossOrigin="anonymous"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full overflow-auto`}
      >
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics GA_MEASUREMENT_ID={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
        {children}
      </body>
    </html>
  );
}
