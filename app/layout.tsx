import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { Toaster } from "sonner";
import "katex/dist/katex.min.css";
import NextTopLoader from "nextjs-toploader";
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Your App",
    template: "%s | Your App",
  },
  description: "Modern web application built with Next.js",
  applicationName: "Your App",
  keywords: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
  authors: [
    {
      name: "Baxtiyor Qurbonnazarov",
    },
  ],
  creator: "Baxtiyor Qurbonnazarov",
  metadataBase: new URL("https://your-domain.com"),
  openGraph: {
    title: "Your App",
    description: "Modern web application built with Next.js",
    siteName: "Your App",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Your App",
    description: "Modern web application built with Next.js",
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
      suppressHydrationWarning
      className={`${inter.variable} h-full scroll-smooth`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <QueryProvider>
          <NextTopLoader
            color="#818cf8"
            initialPosition={0.08}
            crawlSpeed={200}
            height={3}
            crawl={true}
            showSpinner={false}
            easing="ease"
            speed={200}
          />
          {children}
          <Toaster position="top-center" />
        </QueryProvider>
      </body>
    </html>
  );
}
